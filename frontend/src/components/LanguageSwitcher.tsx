import { useI18n } from '../lib/i18n';
import { LANGS } from '../lib/translations';

export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 text-xs font-semibold ${
        dark ? 'border-white/20 bg-white/5' : 'border-ink-900/10 bg-white'
      }`}
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`rounded-full px-2.5 py-1 transition ${
            lang === code
              ? 'bg-brand-600 text-white'
              : dark
                ? 'text-white/60 hover:text-white'
                : 'text-ink-700/60 hover:text-ink-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
