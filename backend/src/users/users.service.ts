import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserRole, UserStatus, TrialStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateAdminDto } from './dto/create-admin.schema';
import { CreateAgentDto } from './dto/create-agent.schema';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  // --- Super Admin : gestion des Administrateurs ---

  async createAdmin(dto: CreateAdminDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email.');

    const passwordHash = await argon2.hash(dto.password);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + dto.trialDurationDays);

    const admin = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName, trackingMode: dto.trackingMode },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          role: UserRole.ADMIN,
          status: UserStatus.TRIAL,
          organizationId: organization.id,
          createdById: actorId,
        },
      });

      await tx.trialPeriod.create({
        data: {
          userId: user.id,
          durationDays: dto.trialDurationDays,
          endDate,
          status: TrialStatus.ACTIVE,
        },
      });

      return user;
    });

    await this.auditLog.log(actorId, 'ADMIN_CREATED', 'User', admin.id, {
      email: dto.email,
      trialDurationDays: dto.trialDurationDays,
    });

    return this.getAdminWithTrial(admin.id);
  }

  async listAdmins() {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      include: { trialPeriod: true, organization: true },
      orderBy: { createdAt: 'desc' },
    });

    return admins.map((admin) => this.withRemainingTime(admin));
  }

  async getAdminWithTrial(id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      include: { trialPeriod: true, organization: true },
    });
    if (!admin) throw new NotFoundException('Administrateur introuvable.');
    return this.withRemainingTime(admin);
  }

  private withRemainingTime(admin: any) {
    let daysRemaining: number | null = null;
    if (admin.trialPeriod?.endDate) {
      const diffMs = new Date(admin.trialPeriod.endDate).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
    return { ...admin, passwordHash: undefined, daysRemaining };
  }

  async suspendAdmin(id: string, actorId: string) {
    const admin = await this.requireAdmin(id);
    await this.prisma.user.update({ where: { id: admin.id }, data: { status: UserStatus.SUSPENDED } });
    await this.auditLog.log(actorId, 'ADMIN_SUSPENDED', 'User', id);
    return this.getAdminWithTrial(id);
  }

  async reactivateAdmin(id: string, actorId: string) {
    const admin = await this.requireAdmin(id);
    const newStatus = admin.trialPeriod && admin.trialPeriod.status === TrialStatus.ACTIVE
      ? UserStatus.TRIAL
      : UserStatus.ACTIVE;
    await this.prisma.user.update({ where: { id: admin.id }, data: { status: newStatus } });
    await this.auditLog.log(actorId, 'ADMIN_REACTIVATED', 'User', id);
    return this.getAdminWithTrial(id);
  }

  async deleteAdmin(id: string, actorId: string) {
    await this.requireAdmin(id);
    await this.prisma.user.delete({ where: { id } });
    await this.auditLog.log(actorId, 'ADMIN_DELETED', 'User', id);
    return { success: true };
  }

  private async requireAdmin(id: string) {
    const admin = await this.prisma.user.findUnique({ where: { id }, include: { trialPeriod: true } });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new NotFoundException('Administrateur introuvable.');
    }
    return admin;
  }

  // --- Admin : gestion des Agents (scope organisation) ---

  async createAgent(dto: CreateAgentDto, actorOrganizationId: string, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email.');

    const passwordHash = await argon2.hash(dto.password);
    const agent = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: UserRole.AGENT,
        status: UserStatus.ACTIVE,
        organizationId: actorOrganizationId,
        createdById: actorId,
      },
    });

    await this.auditLog.log(actorId, 'AGENT_CREATED', 'User', agent.id, { email: dto.email });
    return { ...agent, passwordHash: undefined };
  }

  async listAgents(organizationId: string) {
    const agents = await this.prisma.user.findMany({
      where: { role: UserRole.AGENT, organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return agents.map((a) => ({ ...a, passwordHash: undefined }));
  }

  async removeAgent(id: string, organizationId: string, actorId: string) {
    const agent = await this.prisma.user.findUnique({ where: { id } });
    if (!agent || agent.role !== UserRole.AGENT || agent.organizationId !== organizationId) {
      throw new ForbiddenException('Agent introuvable dans votre organisation.');
    }
    await this.prisma.user.delete({ where: { id } });
    await this.auditLog.log(actorId, 'AGENT_REMOVED', 'User', id);
    return { success: true };
  }
}
