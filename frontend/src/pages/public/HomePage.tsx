import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../lib/i18n';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { Logo } from '../../components/Logo';
import { GpsOverlay } from '../../components/illustrations';
import {
  TruckIcon,
  ShipIcon,
  PlaneIcon,
  MapPinIcon,
  ClockIcon,
  ShieldIcon,
  SearchIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '../../components/icons';

/**
 * Photos réelles libres de droit (licence Unsplash — usage commercial libre,
 * sans attribution requise). Servies directement depuis le CDN Unsplash.
 */
const PHOTOS = {
  heroTruck:
    'https://images.unsplash.com/photo-1720811559395-3ed8d1b16649?q=80&w=1400&auto=format&fit=crop',
  networkShip:
    'https://images.unsplash.com/photo-1758549683132-72ac09a3d5b5?q=80&w=1400&auto=format&fit=crop',
  serviceRoad:
    'https://images.unsplash.com/photo-1708193203896-ba0630862bb6?q=80&w=800&auto=format&fit=crop',
  serviceSea:
    'https://images.unsplash.com/photo-1759389003674-bbc78848a532?q=80&w=800&auto=format&fit=crop',
  serviceAir:
    'https://images.unsplash.com/photo-1769273747778-74eeb3f6d551?q=80&w=800&auto=format&fit=crop',
};

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
    { icon: TruckIcon, title: t('services.road.title'), text: t('services.road.text'), photo: PHOTOS.serviceRoad },
    { icon: ShipIcon, title: t('services.sea.title'), text: t('services.sea.text'), photo: PHOTOS.serviceSea },
    { icon: PlaneIcon, title: t('services.air.title'), text: t('services.air.text'), photo: PHOTOS.serviceAir },
  ];

  const FEATURES = [
    { icon: MapPinIcon, title: t('features.gps.title'), text: t('features.gps.text') },
    { icon: ClockIcon, title: t('features.history.title'), text: t('features.history.text') },
    { icon: ShieldIcon, title: t('features.org.title'), text: t('features.org.text') },
  ];

  const STATS = [
    { num: t('hero.stat1Num'), label: t('hero.stat1Label') },
    { num: t('hero.stat2Num'), label: t('hero.stat2Label') },
    { num: t('hero.stat3Num'), label: t('hero.stat3Label') },
  ];

  const NETWORK_POINTS = [
    { icon: TruckIcon, text: t('network.pointRoad') },
    { icon: ShipIcon, text: t('network.pointSea') },
    { icon: PlaneIcon, text: t('network.pointAir') },
  ];

  return (
    <div className="min-h-full bg-white text-ink-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-ink-800/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo iconClassName="h-8 w-8" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink-700 sm:flex">
            <a href="#services" className="hover:text-brand-600">{t('nav.services')}</a>
            <a href="#network" className="hover:text-brand-600">{t('network.kicker')}</a>
            <a href="#features" className="hover:text-brand-600">{t('nav.features')}</a>
            <Link to="/track" className="hover:text-brand-600">{t('nav.track')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero — photo plein cadre, texte superposé */}
      <section className="relative overflow-hidden border-b border-white/5 bg-ink-900 text-white">
        {/* Photo de fond */}
        <div className="absolute inset-0">
          <img
            src={PHOTOS.heroTruck}
            alt="Camion de transport sur la route"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900/95 via-ink-900/75 to-ink-900/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-transparent to-ink-900/40" />
          <GpsOverlay tone="light" className="absolute inset-0 h-full w-full opacity-90" />
        </div>

        {/* Contenu */}
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center px-4 py-16 sm:px-6 sm:py-20">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-400">
              {t('hero.badge')}
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {t('hero.title1')} <span className="text-brand-500">{t('hero.title2')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-100/70">{t('hero.subtitle')}</p>

            <form
              onSubmit={handleTrack}
              className="mt-10 flex max-w-xl flex-col gap-3 rounded-md border border-white/10 bg-white p-2 sm:flex-row"
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
                className="flex items-center justify-center gap-2 rounded-md bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {t('hero.searchButton')}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-100/70">
              {[t('hero.check1'), t('hero.check2'), t('hero.check3')].map((label) => (
                <span key={label} className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-brand-500" />
                  {label}
                </span>
              ))}
            </div>

            {/* Bandeau statistiques */}
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white sm:text-3xl">{s.num}</div>
                  <div className="mt-1 text-xs text-ink-100/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bandeau d'informations en bas du hero (en transit / ETA) */}
        <div className="relative border-t border-white/10 bg-ink-900/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-semibold leading-none">{t('hero.liveBadge')}</p>
                <p className="mt-0.5 text-[11px] text-ink-100/60">{t('hero.liveBadgeSub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-brand-400" />
              <div>
                <p className="text-xs font-semibold leading-none">{t('hero.etaBadge')}</p>
                <p className="mt-0.5 text-[11px] text-ink-100/60">{t('hero.etaBadgeSub')}</p>
              </div>
            </div>
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
          {SERVICES.map(({ icon: Icon, title, text, photo }) => (
            <div
              key={title}
              className="group overflow-hidden rounded-md border border-ink-900/10 bg-white transition hover:border-brand-300"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={photo}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-ink-900/0 to-transparent" />
                <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-ink-900/70 text-white">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700/80">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Réseau mondial (bande navire) */}
      <section id="network" className="relative overflow-hidden bg-ink-900 text-white">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-400">{t('network.kicker')}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t('network.title')}</h2>
            <p className="mt-4 max-w-md text-ink-100/70">{t('network.text')}</p>
            <ul className="mt-8 space-y-4">
              {NETWORK_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-brand-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-ink-100/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-md border border-white/10">
              <img
                src={PHOTOS.networkShip}
                alt="Porte-conteneurs en mer au coucher du soleil"
                className="h-[360px] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent" />
              <GpsOverlay tone="light" className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 border-t border-white/10 bg-ink-900/70 px-5 py-3 text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <p className="text-xs font-semibold">{t('network.badge')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{t('features.kicker')}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t('features.title')}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-md border border-ink-900/10 bg-white p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700/80">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-md bg-brand-600 p-10 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t('cta.title')}</h2>
            <p className="mt-2 text-brand-50/90">{t('cta.subtitle')}</p>
          </div>
          <Link
            to="/track"
            className="flex shrink-0 items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            {t('cta.button')}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-900/10 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-ink-700/70 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} TransEuroGoo — {t('footer.rights')}</span>
          <div className="flex gap-6">
            <Link to="/track" className="hover:text-brand-600">{t('nav.track')}</Link>
            <Link to={user ? roleHome(user.role) : '/login'} className="text-ink-700/40 hover:text-ink-700/70">
              {user ? t('nav.myspace') : t('nav.login')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
