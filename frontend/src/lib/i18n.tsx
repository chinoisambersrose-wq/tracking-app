import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { Lang, STRINGS } from './translations';

const STORAGE_KEY = 'tracking-app-lang';

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'fr';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'de' || stored === 'fr' ? stored : 'fr';
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* stockage indisponible : on continue sans persister */
    }
  }, []);

  const t = useCallback((key: string) => STRINGS[lang][key] ?? STRINGS.fr[key] ?? key, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans I18nProvider');
  return ctx;
}

export type { Lang };
