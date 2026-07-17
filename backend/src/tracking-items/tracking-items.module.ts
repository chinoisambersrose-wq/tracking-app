import { Module } from '@nestjs/common';
import { TrackingItemsService } from './tracking-items.service';
import { TrackingItemsController } from './tracking-items.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogModule, RealtimeModule, NotificationsModule],
  controllers: [TrackingItemsController],
  providers: [TrackingItemsService],
  exports: [TrackingItemsService],
})
export class TrackingItemsModule {}
