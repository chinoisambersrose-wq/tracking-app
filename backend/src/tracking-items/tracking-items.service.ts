import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTrackingItemDto } from './dto/create-tracking-item.schema';
import { UpdateStatusDto } from './dto/update-status.schema';
import { UpdateMetadataDto } from './dto/update-metadata.schema';

function generatePublicCode(): string {
  return `TRK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const EARTH_RADIUS_KM = 6371;

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Si les métadonnées contiennent un trajet simulé complet (origine,
 * destination, vitesse, heure de départ), (re)calcule la distance et l'heure
 * d'arrivée estimées à partir de ces valeurs. `journeyDistanceKm` et
 * `arrivalAt` ne sont donc jamais pris tels quels depuis le client : ils sont
 * toujours dérivés côté serveur pour rester cohérents avec les coordonnées
 * et la vitesse effectivement enregistrées.
 */
function withComputedJourney(metadata: Record<string, unknown>): Record<string, unknown> {
  const originLat = metadata.originLat;
  const originLng = metadata.originLng;
  const destinationLat = metadata.destinationLat;
  const destinationLng = metadata.destinationLng;
  const journeySpeedKmh = metadata.journeySpeedKmh;
  const departureAt = metadata.departureAt;

  const hasJourney =
    typeof originLat === 'number' &&
    typeof originLng === 'number' &&
    typeof destinationLat === 'number' &&
    typeof destinationLng === 'number' &&
    typeof journeySpeedKmh === 'number' &&
    journeySpeedKmh > 0 &&
    typeof departureAt === 'string' &&
    !isNaN(new Date(departureAt).getTime());

  if (!hasJourney) return metadata;

  const distanceKm = haversineDistanceKm(
    originLat as number,
    originLng as number,
    destinationLat as number,
    destinationLng as number,
  );
  const departure = new Date(departureAt as string);
  const hours = distanceKm / (journeySpeedKmh as number);
  const arrival = new Date(departure.getTime() + hours * 3_600_000);

  return {
    ...metadata,
    journeyDistanceKm: Math.round(distanceKm * 100) / 100,
    arrivalAt: arrival.toISOString(),
  };
}

@Injectable()
export class TrackingItemsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private realtime: RealtimeGateway,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateTrackingItemDto, organizationId: string, actorId: string) {
    const metadata = dto.metadata
      ? withComputedJourney(dto.metadata as Record<string, unknown>)
      : dto.metadata;

    const item = await this.prisma.trackingItem.create({
      data: {
        organizationId,
        type: dto.type,
        label: dto.label,
        currentStatus: dto.initialStatus,
        assignedAgentId: dto.assignedAgentId,
        metadata,
        publicCode: generatePublicCode(),
      },
    });

    await this.prisma.trackingStatusHistory.create({
      data: { trackingItemId: item.id, status: dto.initialStatus, changedById: actorId },
    });

    await this.auditLog.log(actorId, 'TRACKING_ITEM_CREATED', 'TrackingItem', item.id);
    return item;
  }

  async findAllForOrg(organizationId: string) {
    return this.prisma.trackingItem.findMany({
      where: { organizationId },
      include: { assignedAgent: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForOrg(id: string, organizationId: string) {
    const item = await this.prisma.trackingItem.findFirst({
      where: { id, organizationId },
      include: {
        statusHistory: { orderBy: { createdAt: 'desc' } },
        positions: { orderBy: { recordedAt: 'desc' }, take: 50 },
        assignedAgent: { select: { id: true, fullName: true } },
      },
    });
    if (!item) throw new NotFoundException('Élément de tracking introuvable.');
    return item;
  }

  async updateStatus(id: string, organizationId: string, dto: UpdateStatusDto, actorId: string) {
    const item = await this.prisma.trackingItem.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException('Élément de tracking introuvable.');

    const [updated] = await this.prisma.$transaction([
      this.prisma.trackingItem.update({ where: { id }, data: { currentStatus: dto.status } }),
      this.prisma.trackingStatusHistory.create({
        data: { trackingItemId: id, status: dto.status, note: dto.note, changedById: actorId },
      }),
    ]);

    await this.auditLog.log(actorId, 'TRACKING_STATUS_UPDATED', 'TrackingItem', id, { status: dto.status });

    this.realtime.emitStatusUpdate(organizationId, item.publicCode, {
      trackingItemId: id,
      status: dto.status,
      note: dto.note,
      at: new Date(),
    });

    // Notifie l'admin propriétaire de l'organisation (V1 simplifiée)
    const admin = await this.prisma.user.findFirst({ where: { organizationId, role: 'ADMIN' } });
    if (admin) {
      await this.notifications.notify(
        admin.id,
        'STATUS_CHANGE',
        `Statut mis à jour : ${item.label ?? item.publicCode}`,
        `Nouveau statut : ${dto.status}`,
        NotificationChannel.IN_APP,
      );
    }

    return updated;
  }

  async updateMetadata(id: string, organizationId: string, metadata: UpdateMetadataDto, actorId: string) {
    const item = await this.prisma.trackingItem.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException('Élément de tracking introuvable.');

    const merged = withComputedJourney({
      ...((item.metadata as Record<string, unknown>) ?? {}),
      ...metadata,
    });

    const updated = await this.prisma.trackingItem.update({
      where: { id },
      data: { metadata: merged },
    });

    await this.auditLog.log(actorId, 'TRACKING_ITEM_METADATA_UPDATED', 'TrackingItem', id);
    return updated;
  }

  async assignAgent(id: string, organizationId: string, agentId: string, actorId: string) {
    const agent = await this.prisma.user.findFirst({ where: { id: agentId, organizationId, role: 'AGENT' } });
    if (!agent) throw new ForbiddenException("Cet agent n'appartient pas à votre organisation.");

    const item = await this.prisma.trackingItem.update({
      where: { id },
      data: { assignedAgentId: agentId },
    });

    await this.auditLog.log(actorId, 'TRACKING_ITEM_ASSIGNED', 'TrackingItem', id, { agentId });
    return item;
  }
}
