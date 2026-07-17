import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicMetadata } from '../tracking-items/dto/tracking-item-metadata.schema';

/**
 * Endpoints publics, sans authentification : page de suivi accessible avec
 * juste le code de tracking (comme un numéro de colis). Rate-limité pour
 * éviter l'énumération de codes.
 */
@Controller('public')
export class PublicTrackingController {
  constructor(private prisma: PrismaService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('track/:code')
  async track(@Param('code') code: string) {
    const item = await this.prisma.trackingItem.findUnique({
      where: { publicCode: code },
      include: {
        statusHistory: { orderBy: { createdAt: 'asc' }, select: { status: true, note: true, createdAt: true } },
        positions: { orderBy: { recordedAt: 'desc' }, take: 1 },
        organization: { select: { name: true, trackingMode: true } },
      },
    });

    if (!item) throw new NotFoundException('Aucun résultat pour ce code de suivi.');

    return {
      publicCode: item.publicCode,
      type: item.type,
      label: item.label,
      currentStatus: item.currentStatus,
      statusHistory: item.statusHistory,
      lastPosition: item.positions[0] ?? null,
      organizationName: item.organization.name,
      trackingMode: item.organization.trackingMode,
      // Sous-ensemble sûr des métadonnées (poids, catégorie, description...) :
      // les coordonnées de contact (téléphones, adresse) restent privées.
      details: toPublicMetadata(item.metadata),
    };
  }
}
