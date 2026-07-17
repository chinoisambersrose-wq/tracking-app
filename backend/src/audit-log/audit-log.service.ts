import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(actorId: string | null, action: string, targetType: string, targetId?: string, metadata?: Record<string, unknown>) {
    return this.prisma.auditLog.create({
      data: { actorId, action, targetType, targetId, metadata: metadata as any },
    });
  }

  async listForTarget(targetType: string, targetId: string) {
    return this.prisma.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async listAll(take = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { actor: { select: { id: true, fullName: true, email: true } } },
    });
  }
}
