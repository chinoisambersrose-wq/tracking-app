import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TranslationService } from './translation.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { translateSchema, TranslateDto } from './dto/translate.schema';

/**
 * Endpoint public (pas d'authentification requise) : utilisé par la page de
 * suivi publique et la page d'accueil pour traduire le texte libre affiché
 * (description, commentaires...). Throttlé pour éviter d'épuiser le quota
 * du service de traduction externe.
 */
@Controller('translate')
export class TranslationController {
  constructor(private translation: TranslationService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post()
  async translate(@Body(new ZodValidationPipe(translateSchema)) dto: TranslateDto) {
    const translations = await this.translation.translateBatch(dto.texts, dto.source, dto.target);
    return { translations };
  }
}
