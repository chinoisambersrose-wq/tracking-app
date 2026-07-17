import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RecordPositionDto } from './dto/record-position.schema';

@Injectable()
export class PositionsService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  /**
   * Enregistre une position. Deux cas :
   * - AGENT : doit être l'agent assigné à l'élément (ou l'élément est libre) ;
   *   la position lui est rattachée (agentId renseigné).
   * - ADMIN : peut définir/corriger manuellement la position de n'importe quel
   *   élément de son organisation (ex: initialisation, saisie manuelle sans
   *   agent sur le terrain) ; la position n'est rattachée à aucun agent.
   */
  async record(dto: RecordPositionDto, organizationId: string, actorId: string, actorRole: UserRole) {
    const item = await this.prisma.trackingItem.findFirst({
      where: { id: dto.trackingItemId, organizationId },
    });
    if (!item) throw new NotFoundException('Élément de tracking introuvable.');

    let agentId: string | null = null;

    if (actorRole === UserRole.AGENT) {
      if (item.assignedAgentId && item.assignedAgentId !== actorId) {
        throw new ForbiddenException("Cet élément n'est pas assigné à cet agent.");
      }
      agentId = actorId;
    }
    // Pour un ADMIN, agentId reste null : la position est saisie manuellement,
    // pas rattachée à un agent sur le terrain.

    const position = await this.prisma.position.create({
      data: {
        trackingItemId: dto.trackingItemId,
        agentId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        speed: dto.speed,
        heading: dto.heading,
        accuracy: dto.accuracy,
      },
    });

    this.realtime.emitPositionUpdate(organizationId, item.publicCode, position);
    return position;
  }

  async history(trackingItemId: string, organizationId: string, take = 200) {
    const item = await this.prisma.trackingItem.findFirst({
      where: { id: trackingItemId, organizationId },
    });
    if (!item) throw new NotFoundException('Élément de tracking introuvable.');

    return this.prisma.position.findMany({
      where: { trackingItemId },
      orderBy: { recordedAt: 'desc' },
      take,
    });
  }
}
