import { Injectable, Logger } from '@nestjs/common';

/**
 * Traduction de texte libre via l'API gratuite MyMemory (aucune clé requise,
 * quota limité ~5000 mots/jour/IP). Un cache mémoire simple évite de
 * retraduire les mêmes chaînes (statuts, descriptions récurrentes...) et
 * réduit la consommation du quota. Le cache est volatile (perdu au redeploy),
 * ce qui est suffisant pour cet usage.
 */
@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private cache = new Map<string, string>();

  async translateBatch(texts: string[], source: string, target: string): Promise<string[]> {
    if (source === target) return texts;

    return Promise.all(texts.map((text) => this.translateOne(text, source, target)));
  }

  private async translateOne(text: string, source: string, target: string): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    const cacheKey = `${source}|${target}|${trimmed}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${source}|${target}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

      const data = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number | string };
      const translated = data.responseData?.translatedText;

      if (!translated || String(data.responseStatus) === '403') {
        return text; // quota dépassé ou réponse invalide : on garde le texte original
      }

      this.cache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      this.logger.warn(`Échec de traduction ("${trimmed.slice(0, 30)}..."): ${(err as Error).message}`);
      return text; // dégradation silencieuse : on affiche le texte original plutôt qu'une erreur
    }
  }
}
