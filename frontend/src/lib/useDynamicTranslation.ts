import { useEffect, useState } from 'react';
import { api } from './api';
import { Lang } from './i18n';

/**
 * Traduit à la volée une liste de textes libres (venant de la base de
 * données : description, statut, commentaires...) via l'API backend
 * /translate. Retourne une fonction `translate(text)` qui renvoie la version
 * traduite si disponible, sinon le texte original (pendant le chargement, en
 * cas d'échec, ou si la langue cible est déjà le français).
 */
export function useDynamicTranslation(texts: (string | undefined | null)[], lang: Lang, source: Lang = 'fr') {
  const unique = Array.from(new Set(texts.filter((t): t is string => !!t && t.trim() !== '')));
  const key = unique.join('§');
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lang === source || unique.length === 0) {
      setMap({});
      return;
    }
    let cancelled = false;
    api
      .post<{ translations: string[] }>('/translate', { texts: unique, target: lang, source })
      .then(({ data }) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        unique.forEach((orig, i) => {
          next[orig] = data.translations[i] ?? orig;
        });
        setMap(next);
      })
      .catch(() => {
        if (!cancelled) setMap({});
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, lang, source]);

  return function translate(text: string | undefined | null): string | undefined | null {
    if (!text) return text;
    return map[text] ?? text;
  };
}
