import { Test } from '@nestjs/testing';
import { TrialStatus, UserStatus, NotificationChannel } from '@prisma/client';
import { TrialsService } from '../src/trials/trials.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditLogService } from '../src/audit-log/audit-log.service';
import { NotificationsService } from '../src/notifications/notifications.service';

/**
 * Tests de la logique d'expiration des essais — fonctionnalité critique
 * mentionnée explicitement dans les exigences du projet.
 */
describe('TrialsService', () => {
  let service: TrialsService;
  let prisma: {
    trialPeriod: { findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let auditLog: { log: jest.Mock };
  let notifications: { notify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      trialPeriod: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      user: { update: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    auditLog = { log: jest.fn() };
    notifications = { notify: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TrialsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(TrialsService);
  });

  it("expire un essai dont la date de fin est dépassée", async () => {
    const overdueTrial = {
      id: 'trial-1',
      userId: 'user-1',
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // hier
      status: TrialStatus.ACTIVE,
      user: { id: 'user-1', status: UserStatus.TRIAL },
    };
    prisma.trialPeriod.findMany.mockResolvedValue([overdueTrial]);
    prisma.trialPeriod.update.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    const count = await service.expireOverdueTrials();

    expect(count).toBe(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: UserStatus.EXPIRED },
    });
    expect(auditLog.log).toHaveBeenCalledWith(null, 'TRIAL_AUTO_EXPIRED', 'TrialPeriod', 'trial-1');
    expect(notifications.notify).toHaveBeenCalledWith(
      'user-1',
      'TRIAL_EXPIRED',
      expect.any(String),
      expect.any(String),
      NotificationChannel.EMAIL,
    );
  });

  it('ne touche pas un compte déjà suspendu manuellement', async () => {
    const overdueTrial = {
      id: 'trial-2',
      userId: 'user-2',
      endDate: new Date(Date.now() - 1000),
      status: TrialStatus.ACTIVE,
      user: { id: 'user-2', status: UserStatus.SUSPENDED },
    };
    prisma.trialPeriod.findMany.mockResolvedValue([overdueTrial]);

    await service.expireOverdueTrials();

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('prolonge un essai en ajoutant les jours à la date de fin existante', async () => {
    const currentEndDate = new Date('2026-08-01T00:00:00.000Z');
    prisma.trialPeriod.findUnique.mockResolvedValue({ id: 'trial-3', userId: 'user-3', endDate: currentEndDate });
    prisma.trialPeriod.update.mockImplementation(({ data }) => Promise.resolve({ id: 'trial-3', ...data }));
    prisma.user.update.mockResolvedValue({});

    const result = await service.extendTrial('user-3', 7, 'actor-1');

    const expectedEndDate = new Date('2026-08-08T00:00:00.000Z');
    expect(result.endDate.toISOString()).toBe(expectedEndDate.toISOString());
    expect(auditLog.log).toHaveBeenCalledWith(
      'actor-1',
      'TRIAL_EXTENDED',
      'TrialPeriod',
      'trial-3',
      expect.objectContaining({ additionalDays: 7 }),
    );
  });
});
