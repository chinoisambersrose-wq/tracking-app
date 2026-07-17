import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TrialsService } from './trials.service';

@Injectable()
export class TrialsCron {
  private readonly logger = new Logger(TrialsCron.name);

  constructor(private trialsService: TrialsService) {}

  // Tous les jours à 02h00 : expire les essais dépassés
  @Cron('0 2 * * *')
  async handleExpiration() {
    this.logger.log('Vérification quotidienne des essais expirés...');
    await this.trialsService.expireOverdueTrials();
  }

  // Tous les jours à 08h00 : notifie les essais qui arrivent à échéance
  @Cron('0 8 * * *')
  async handleExpiringSoonNotifications() {
    this.logger.log('Vérification des essais arrivant à échéance...');
    await this.trialsService.notifyExpiringSoon();
  }
}
