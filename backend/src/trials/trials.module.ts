import { Module } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { TrialsController } from './trials.controller';
import { TrialsCron } from './trials.cron';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogModule, NotificationsModule],
  controllers: [TrialsController],
  providers: [TrialsService, TrialsCron],
  exports: [TrialsService],
})
export class TrialsModule {}
