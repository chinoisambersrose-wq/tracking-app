import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
    } catch (err) {
      this.logger.error(`Échec envoi email à ${to}: ${(err as Error).message}`);
    }
  }
}
