import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackingMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organisation introuvable.');
    return org;
  }

  async updateTrackingMode(id: string, trackingMode: TrackingMode) {
    return this.prisma.organization.update({ where: { id }, data: { trackingMode } });
  }
}
