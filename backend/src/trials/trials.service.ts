import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TrialStatus, UserStatus, NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TrialsService {
  private readonly logger = new Logger(TrialsService.name);

  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
  ) {}

  async extendTrial(userId: string, additionalDays: number, actorId: string) {
    const trial = await this.prisma.trialPeriod.findUnique({ where: { userId } });
    if (!trial) throw new NotFoundException("Aucune période d'essai pour cet administrateur.");

    const newEndDate = new Date(trial.endDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    const updatedTrial = await this.prisma.trialPeriod.update({
      where: { userId },
      data: {
        endDate: newEndDate,
        status: TrialStatus.EXTENDED,
        extendedById: actorId,
        extendedAt: new Date(),
      },
    });

    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.TRIAL } });

    await this.auditLog.log(actorId, 'TRIAL_EXTENDED', 'TrialPeriod', trial.id, {
      additionalDays,
      newEndDate,
    });

    return updatedTrial;
  }

  /**
   * Fait autorité pour l'expiration : appelée par le cron quotidien.
   * Passe les comptes en TRIAL dont endDate est dépassée à EXPIRED,
   * bloque leur accès, journalise et notifie.
   */
  async expireOverdueTrials() {
    const overdue = await this.prisma.trialPeriod.findMany({
      where: {
        endDate: { lt: new Date() },
        status: { in: [TrialStatus.ACTIVE, TrialStatus.EXTENDED] },
      },
      include: { user: true },
    });

    for (const trial of overdue) {
      if (trial.user.status === UserStatus.SUSPENDED) continue; // ne pas écraser une suspension manuelle

      await this.prisma.$transaction([
        this.prisma.trialPeriod.update({ where: { id: trial.id }, data: { status: TrialStatus.EXPIRED } }),
        this.prisma.user.update({ where: { id: trial.userId }, data: { status: UserStatus.EXPIRED } }),
      ]);

      await this.auditLog.log(null, 'TRIAL_AUTO_EXPIRED', 'TrialPeriod', trial.id);

      await this.notifications.notify(
        trial.userId,
        'TRIAL_EXPIRED',
        "Votre période d'essai a expiré",
        "Votre accès a été suspendu. Contactez le Super Admin pour prolonger votre essai.",
        NotificationChannel.EMAIL,
      );
    }

    this.logger.log(`${overdue.length} essai(s) expiré(s) traité(s).`);
    return overdue.length;
  }

  /**
   * Notifie les admins dont l'essai expire dans N jours (TRIAL_EXPIRING_SOON_DAYS).
   */
  async notifyExpiringSoon() {
    const daysThreshold = Number(process.env.TRIAL_EXPIRING_SOON_DAYS ?? 3);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);

    const expiringSoon = await this.prisma.trialPeriod.findMany({
      where: {
        status: { in: [TrialStatus.ACTIVE, TrialStatus.EXTENDED] },
        endDate: { gte: new Date(), lte: threshold },
      },
      include: { user: true },
    });

    for (const trial of expiringSoon) {
      await this.notifications.notify(
        trial.userId,
        'TRIAL_EXPIRING_SOON',
        "Votre période d'essai arrive à échéance",
        `Votre essai expire le ${trial.endDate.toLocaleDateString('fr-FR')}. Contactez le Super Admin pour le prolonger.`,
        NotificationChannel.EMAIL,
      );
    }

    this.logger.log(`${expiringSoon.length} notification(s) d'expiration proche envoyée(s).`);
    return expiringSoon.length;
  }

  async listAllWithStatus() {
    return this.prisma.trialPeriod.findMany({
      include: { user: { select: { id: true, email: true, fullName: true, status: true } } },
      orderBy: { endDate: 'asc' },
    });
  }
}
