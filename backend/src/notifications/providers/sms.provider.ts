import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private client =
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

  async sendSms(to: string, body: string) {
    if (!this.client) return this.logger.warn('Twilio non configuré, SMS ignoré.');
    try {
      await this.client.messages.create({ to, from: process.env.TWILIO_SMS_FROM, body });
    } catch (err) {
      this.logger.error(`Échec envoi SMS à ${to}: ${(err as Error).message}`);
    }
  }

  async sendWhatsapp(to: string, body: string) {
    if (!this.client) return this.logger.warn('Twilio non configuré, WhatsApp ignoré.');
    try {
      await this.client.messages.create({
        to: `whatsapp:${to}`,
        from: process.env.TWILIO_WHATSAPP_FROM,
        body,
      });
    } catch (err) {
      this.logger.error(`Échec envoi WhatsApp à ${to}: ${(err as Error).message}`);
    }
  }
}
