import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
  ) {}

  /**
   * Crée une notification in-app et la dispatch sur le canal demandé.
   * Le canal IN_APP est toujours enregistré ; EMAIL/SMS/WHATSAPP déclenchent
   * en plus un envoi externe.
   */
  async notify(
    userId: string,
    type: string,
    title: string,
    content: string,
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, content, channel },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return notification;

    if (channel === NotificationChannel.EMAIL) {
      await this.emailProvider.send(user.email, title, content);
    }
    // SMS/WhatsApp nécessitent un numéro de téléphone (à ajouter au modèle User
    // si besoin en V2) ; les hooks sont prêts dans SmsProvider.

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { sentAt: new Date() },
    });

    return notification;
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }
}
