import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { MapView } from '../../components/MapView';
import { useI18n } from '../../lib/i18n';
import { useDynamicTranslation } from '../../lib/useDynamicTranslation';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import {
  SearchIcon,
  PackageIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  WhatsAppIcon,
} from '../../components/icons';

interface TrackingDetails {
  category?: string;
  weightKg?: number;
  declaredValue?: number;
  fragile?: boolean;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  description?: string;
  plateNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientEmail?: string;
  carrier?: string;
  shipmentMode?: string;
  carrierReferenceNo?: string;
  paymentMode?: string;
  totalFreight?: number;
  originCity?: string;
  destinationCity?: string;
  expectedDeliveryDate?: string;
  pickupDate?: string;
  pickupTime?: string;
  departureTime?: string;
  comments?: string;
}

interface TrackingResult {
  publicCode: string;
  type: string;
  label: string | null;
  currentStatus: string;
  statusHistory: { status: string; note: string | null; createdAt: string }[];
  lastPosition: { latitude: number; longitude: number } | null;
  organizationName: string;
  trackingMode: string;
  details?: TrackingDetails;
}

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE' };

/** Détermine une couleur d'accent selon des mots-clés usuels de statut (FR/EN). */
function statusTone(status: string): { bg: string; text: string; ring: string } {
  const s = status.toLowerCase();
  if (/(livr|deliver|termin|complet)/.test(s)) return { bg: 'bg-emerald-600', text: 'text-emerald-700', ring: 'ring-emerald-200' };
  if (/(retard|probl|échou|echec|annul|delay|fail|cancel)/.test(s)) return { bg: 'bg-red-600', text: 'text-red-700', ring: 'ring-red-200' };
  if (/(attente|hold|pending)/.test(s)) return { bg: 'bg-gray-500', text: 'text-gray-700', ring: 'ring-gray-200' };
  if (/(transit|route|cours|expédi|ship)/.test(s)) return { bg: 'bg-blue-600', text: 'text-blue-700', ring: 'ring-blue-200' };
  return { bg: 'bg-brand-600', text: 'text-brand-700', ring: 'ring-brand-200' };
}

/** Génère un motif de code-barres décoratif (non scannable) déterministe à partir du code. */
function barcodeBars(code: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    bars.push((c % 3) + 1, ((c * 7) % 3) + 1);
  }
  return bars.length > 0 ? bars : [1, 2, 1, 3, 2];
}

function InfoCell({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="border-b border-ink-900/5 py-2 sm:border-b-0">
      <dt className="text-xs uppercase tracking-wide text-ink-700/50">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

export default function PublicTrackingPage() {
  const [searchParams] = useSearchParams();
  const { t, lang } = useI18n();
  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.get<TrackingResult>(`/public/track/${value.trim()}`);
      setResult(data);
    } catch {
      setError(t('track.notFound'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = searchParams.get('code');
    if (initial) runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    runSearch(code);
  }

  const d = result?.details;
  const hasPackage = !!(d && (d.category || d.description || d.weightKg || d.lengthCm));
  const hasShipment = !!(
    d &&
    (d.carrier || d.shipmentMode || d.carrierReferenceNo || d.paymentMode || d.totalFreight || d.originCity || d.destinationCity)
  );
  const hasSender = !!(d && (d.senderName || d.senderPhone || d.senderAddress || d.senderEmail));
  const hasRecipient = !!(d && (d.recipientName || d.recipientPhone || d.recipientAddress || d.recipientEmail));
  const volume = d?.lengthCm && d?.widthCm && d?.heightCm ? (d.lengthCm * d.widthCm * d.heightCm) / 1_000_000 : undefined;
  const volumetricWeight = d?.lengthCm && d?.widthCm && d?.heightCm ? (d.lengthCm * d.widthCm * d.heightCm) / 5000 : undefined;

  // Texte libre venant de la base de données : traduit dynamiquement via l'API
  // (les identifiants/noms propres — transporteur, villes, adresses, contacts —
  // ne sont volontairement pas traduits pour ne pas être corrompus).
  const dynamicTexts = [
    result?.currentStatus,
    d?.category,
    d?.description,
    d?.comments,
    d?.shipmentMode,
    d?.paymentMode,
    d?.vehicleColor,
    ...(result?.statusHistory.map((h) => h.status) ?? []),
    ...(result?.statusHistory.map((h) => h.note) ?? []),
  ];
  const translate = useDynamicTranslation(dynamicTexts, lang);

  const tone = result ? statusTone(result.currentStatus) : null;
  const locale = DATE_LOCALES[lang] ?? 'fr-FR';
  const waNumber = searchParams.get('wa');
  const waDigits = waNumber ? waNumber.replace(/[^\d]/g, '') : null;
  const waLink = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
        `Bonjour, j'ai une question concernant mon envoi ${result?.publicCode ?? code}.`,
      )}`
    : null;

  return (
    <div className="min-h-full bg-gray-50 text-ink-900">
      {/* Header */}
      <header className="border-b border-ink-900/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
              <PackageIcon className="h-5 w-5" />
            </span>
            Tracking<span className="text-brand-600">App</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login" className="text-sm font-medium text-ink-700 hover:text-brand-600">
              {t('nav.pro')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero search */}
      <section className="relative overflow-hidden bg-ink-900 py-14 text-white">
        <div className="bg-hero-grid absolute inset-0 opacity-30" style={{ backgroundSize: '22px 22px' }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('track.title')}</h1>
          <p className="mt-3 text-ink-100/70">{t('track.subtitle')}</p>
          <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 rounded-xl bg-white p-2 shadow-glow sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <SearchIcon className="h-5 w-5 shrink-0 text-ink-600/50" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('track.searchPlaceholder')}
                className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-600/40 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? t('track.searching') : t('track.searchButton')}
            </button>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {result && tone && (
          <div className="space-y-6">
            {/* Status banner */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className={`flex items-center justify-between px-6 py-4 text-white ${tone.bg}`}>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  <CheckCircleIcon className="h-5 w-5" />
                  {t('track.statusPrefix')} {translate(result.currentStatus)}
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  {result.type === 'VEHICLE' ? t('track.typeVehicle') : t('track.typeParcel')}
                </span>
              </div>
              <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xl font-bold">{result.label ?? result.publicCode}</div>
                  <div className="text-sm text-ink-700/60">{result.organizationName}</div>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <div className="flex gap-[2px]" aria-hidden>
                    {barcodeBars(result.publicCode).map((w, i) => (
                      <span key={i} className="block bg-ink-900" style={{ width: `${w}px`, height: '32px' }} />
                    ))}
                  </div>
                  <span className="font-mono text-xs tracking-widest text-ink-700/60">{result.publicCode}</span>
                </div>
              </div>
            </div>

            {/* Shipper / Receiver */}
            {(hasSender || hasRecipient) && (
              <div className="grid gap-6 rounded-2xl bg-white p-6 shadow-card sm:grid-cols-2">
                <div>
                  <h2 className="mb-3 border-b border-ink-900/10 pb-2 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                    {t('track.sender')}
                  </h2>
                  {hasSender ? (
                    <div className="space-y-1 text-sm">
                      {d?.senderName && <div className="font-semibold">{d.senderName}</div>}
                      {d?.senderAddress && <div className="text-ink-700/70">{d.senderAddress}</div>}
                      {d?.senderPhone && <div className="text-ink-700/70">{d.senderPhone}</div>}
                      {d?.senderEmail && <div className="text-ink-700/70">{d.senderEmail}</div>}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-700/40">{t('track.notProvided')}</p>
                  )}
                </div>
                <div>
                  <h2 className="mb-3 border-b border-ink-900/10 pb-2 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                    {t('track.recipient')}
                  </h2>
                  {hasRecipient ? (
                    <div className="space-y-1 text-sm">
                      {d?.recipientName && <div className="font-semibold">{d.recipientName}</div>}
                      {d?.recipientAddress && <div className="text-ink-700/70">{d.recipientAddress}</div>}
                      {d?.recipientPhone && <div className="text-ink-700/70">{d.recipientPhone}</div>}
                      {d?.recipientEmail && <div className="text-ink-700/70">{d.recipientEmail}</div>}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-700/40">{t('track.notProvided')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Shipment info grid */}
            {hasShipment && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                  <TruckIcon className="h-4 w-4" /> {t('track.shipmentInfo')}
                </h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                  <InfoCell label={t('track.origin')} value={d?.originCity} />
                  <InfoCell label={t('track.destination')} value={d?.destinationCity} />
                  <InfoCell label={t('track.shipmentType')} value={result.type === 'VEHICLE' ? t('track.typeVehicle') : t('track.typeParcel')} />
                  <InfoCell label={t('track.carrier')} value={d?.carrier} />
                  <InfoCell label={t('track.shipmentMode')} value={translate(d?.shipmentMode)} />
                  <InfoCell label={t('track.weight')} value={d?.weightKg !== undefined ? `${d.weightKg} kg` : undefined} />
                  <InfoCell label={t('track.carrierRef')} value={d?.carrierReferenceNo} />
                  <InfoCell label={t('track.paymentMode')} value={translate(d?.paymentMode)} />
                  <InfoCell label={t('track.totalFreight')} value={d?.totalFreight !== undefined ? `${d.totalFreight}` : undefined} />
                  <InfoCell label={t('track.expectedDelivery')} value={d?.expectedDeliveryDate} />
                  <InfoCell label={t('track.pickupDate')} value={d?.pickupDate} />
                  <InfoCell label={t('track.pickupTime')} value={d?.pickupTime} />
                  <InfoCell label={t('track.departureTime')} value={d?.departureTime} />
                </dl>
                {d?.comments && (
                  <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                    <span className="font-semibold">{t('track.comments')}</span>
                    {translate(d.comments)}
                  </p>
                )}
              </div>
            )}

            {/* Package / vehicle details */}
            {hasPackage && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-card">
                <h2 className="flex items-center gap-2 px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                  <PackageIcon className="h-4 w-4" /> {t('track.packageDetails')}
                </h2>
                <div className="overflow-x-auto px-6 py-4">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-700/50">
                        <th className="py-2 pr-4">{t('track.qty')}</th>
                        <th className="py-2 pr-4">{t('track.type')}</th>
                        <th className="py-2 pr-4">{t('track.description')}</th>
                        <th className="py-2 pr-4">{t('track.length')}</th>
                        <th className="py-2 pr-4">{t('track.width')}</th>
                        <th className="py-2 pr-4">{t('track.height')}</th>
                        <th className="py-2 pr-4">{t('track.weight')}</th>
                        <th className="py-2">{t('track.declaredValue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4">01</td>
                        <td className="py-2 pr-4">{translate(d?.category) ?? '—'}</td>
                        <td className="py-2 pr-4">{translate(d?.description) ?? '—'}</td>
                        <td className="py-2 pr-4">{d?.lengthCm ?? '—'}</td>
                        <td className="py-2 pr-4">{d?.widthCm ?? '—'}</td>
                        <td className="py-2 pr-4">{d?.heightCm ?? '—'}</td>
                        <td className="py-2 pr-4">{d?.weightKg !== undefined ? `${d.weightKg} kg` : '—'}</td>
                        <td className="py-2">{d?.declaredValue !== undefined ? d.declaredValue : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {(volume !== undefined || volumetricWeight !== undefined) && (
                    <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-xs text-ink-700/60">
                      {volumetricWeight !== undefined && <span>{t('track.volumetricWeight')} {volumetricWeight.toFixed(2)} kg</span>}
                      {volume !== undefined && <span>{t('track.totalVolume')} {volume.toFixed(2)} m³</span>}
                      {d?.weightKg !== undefined && <span>{t('track.actualWeight')} {d.weightKg.toFixed(2)} kg</span>}
                    </div>
                  )}
                  {d?.fragile && (
                    <span className="mt-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      {t('track.fragile')}
                    </span>
                  )}
                  {(d?.plateNumber || d?.vehicleModel || d?.vehicleColor) && (
                    <dl className="mt-4 grid grid-cols-3 gap-4">
                      <InfoCell label={t('track.plate')} value={d?.plateNumber} />
                      <InfoCell label={t('track.model')} value={d?.vehicleModel} />
                      <InfoCell label={t('track.color')} value={translate(d?.vehicleColor)} />
                    </dl>
                  )}
                </div>
              </div>
            )}

            {/* Historique */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-card">
              <h2 className="flex items-center gap-2 px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                <ClockIcon className="h-4 w-4" /> {t('track.history')}
              </h2>
              <div className="overflow-x-auto px-6 py-4">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-700/50">
                      <th className="py-2 pr-4">{t('track.date')}</th>
                      <th className="py-2 pr-4">{t('track.time')}</th>
                      <th className="py-2 pr-4">{t('track.status')}</th>
                      <th className="py-2">{t('track.remark')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.statusHistory.map((h, idx) => {
                      const dt = new Date(h.createdAt);
                      const isLast = idx === result.statusHistory.length - 1;
                      return (
                        <tr key={idx} className={`border-b border-ink-900/5 last:border-0 ${isLast ? 'font-semibold' : ''}`}>
                          <td className="py-2 pr-4">{dt.toLocaleDateString(locale)}</td>
                          <td className="py-2 pr-4">{dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-2 pr-4">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${isLast ? `${statusTone(h.status).bg} text-white` : 'bg-ink-900/5 text-ink-700'}`}>
                              {translate(h.status)}
                            </span>
                          </td>
                          <td className="py-2 text-ink-700/70">{translate(h.note) ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Map */}
            {result.lastPosition && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-card">
                <h2 className="flex items-center gap-2 px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                  <MapPinIcon className="h-4 w-4" /> {t('track.currentPosition')}
                </h2>
                <div className="mt-4 h-96">
                  <MapView
                    markers={[
                      {
                        id: result.publicCode,
                        lat: result.lastPosition.latitude,
                        lng: result.lastPosition.longitude,
                        label: result.label ?? result.publicCode,
                        status: result.currentStatus,
                      },
                    ]}
                    center={[result.lastPosition.latitude, result.lastPosition.longitude]}
                    zoom={12}
                  />
                </div>
              </div>
            )}

            {/* Contact WhatsApp */}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-600 p-5 text-white shadow-card transition hover:bg-emerald-700"
              >
                <div>
                  <div className="text-sm font-semibold">{t('track.whatsappContact')}</div>
                  <div className="text-xs text-emerald-50/90">{waNumber}</div>
                </div>
                <span className="flex shrink-0 items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold">
                  <WhatsAppIcon className="h-4 w-4" />
                  {t('track.whatsappButton')}
                </span>
              </a>
            )}
          </div>
        )}

        {!result && !error && <p className="py-16 text-center text-sm text-ink-700/50">{t('track.empty')}</p>}
      </main>
    </div>
  );
}
