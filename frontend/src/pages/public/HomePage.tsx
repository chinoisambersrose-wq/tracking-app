import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../lib/i18n';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import {
  TruckIcon,
  ShipIcon,
  PlaneIcon,
  PackageIcon,
  MapPinIcon,
  ClockIcon,
  ShieldIcon,
  SearchIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '../../components/icons';

function roleHome(role: string) {
  if (role === 'SUPER_ADMIN') return '/super-admin';
  if (role === 'ADMIN') return '/admin';
  return '/agent';
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [code, setCode] = useState('');

  function handleTrack(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    navigate(trimmed ? `/track?code=${encodeURIComponent(trimmed)}` : '/track');
  }

  const SERVICES = [
    { icon: TruckIcon, title: t('services.road.title'), text: t('services.road.text') },
    { icon: ShipIcon, title: t('services.sea.title'), text: t('services.sea.text') },
    { icon: PlaneIcon, title: t('services.air.title'), text: t('services.air.text') },
  ];

  const FEATURES = [
    { icon: MapPinIcon, title: t('features.gps.title'), text: t('features.gps.text') },
    { icon: ClockIcon, title: t('features.history.title'), text: t('features.history.text') },
    { icon: ShieldIcon, title: t('features.org.title'), text: t('features.org.text') },
  ];

  return (
    <div className="min-h-full bg-white text-ink-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-ink-800/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
              <PackageIcon className="h-5 w-5" />
            </span>
            Tracking<span className="text-brand-600">App</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink-700 sm:flex">
            <a href="#services" className="hover:text-brand-600">{t('nav.services')}</a>
            <a href="#features" className="hover:text-brand-600">{t('nav.features')}</a>
            <Link to="/track" className="hover:text-brand-600">{t('nav.track')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link
                to={roleHome(user.role)}
                className="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
              >
                {t('nav.myspace')}
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="bg-hero-grid absolute inset-0 opacity-40" style={{ backgroundSize: '22px 22px' }} />
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
            {t('hero.badge')}
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            {t('hero.title1')} <span className="text-brand-500">{t('hero.title2')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-600 sm:text-ink-100/80">{t('hero.subtitle')}</p>

          <form
            onSubmit={handleTrack}
            className="mt-10 flex max-w-xl flex-col gap-3 rounded-xl bg-white p-2 shadow-glow sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <SearchIcon className="h-5 w-5 shrink-0 text-ink-600/50" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-600/40 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {t('hero.searchButton')}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-100/70">
            {[t('hero.check1'), t('hero.check2'), t('hero.check3')].map((label) => (
              <span key={label} className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-brand-500" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{t('services.kicker')}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t('services.title')}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border border-ink-900/5 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700/80">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-ink-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">{t('features.kicker')}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t('features.title')}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-brand-500">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-100/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-600 p-10 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t('cta.title')}</h2>
            <p className="mt-2 text-brand-50/90">{t('cta.subtitle')}</p>
          </div>
          <Link
            to="/track"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            {t('cta.button')}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-900/10 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-ink-700/70 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} TrackingApp — {t('footer.rights')}</span>
          <div className="flex gap-6">
            <Link to="/track" className="hover:text-brand-600">{t('nav.track')}</Link>
            <Link to="/login" className="hover:text-brand-600">{t('nav.pro')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
