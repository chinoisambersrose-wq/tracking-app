import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { MapView } from '../../components/MapView';
import {
  SearchIcon,
  PackageIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
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

/** Détermine une couleur d'accent selon des mots-clés usuels de statut (FR). */
function statusTone(status: string): { bg: string; text: string; ring: string; label: string } {
  const s = status.toLowerCase();
  if (/(livr|deliver|termin|complet)/.test(s)) return { bg: 'bg-emerald-600', text: 'text-emerald-700', ring: 'ring-emerald-200', label: status };
  if (/(retard|probl|échou|echec|annul)/.test(s)) return { bg: 'bg-red-600', text: 'text-red-700', ring: 'ring-red-200', label: status };
  if (/(attente|hold|pending)/.test(s)) return { bg: 'bg-gray-500', text: 'text-gray-700', ring: 'ring-gray-200', label: status };
  if (/(transit|route|cours|expédi)/.test(s)) return { bg: 'bg-blue-600', text: 'text-blue-700', ring: 'ring-blue-200', label: status };
  return { bg: 'bg-brand-600', text: 'text-brand-700', ring: 'ring-brand-200', label: status };
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
      setError('Aucun résultat pour ce code de suivi.');
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

  const tone = result ? statusTone(result.currentStatus) : null;
  const d = result?.details;
  const hasPackage = !!(d && (d.category || d.description || d.weightKg || d.lengthCm));
  const hasShipment = !!(
    d &&
    (d.carrier || d.shipmentMode || d.carrierReferenceNo || d.paymentMode || d.totalFreight || d.originCity || d.destinationCity)
  );

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
          <Link to="/login" className="text-sm font-medium text-ink-700 hover:text-brand-600">
            Espace professionnel
          </Link>
        </div>
      </header>

      {/* Hero search */}
      <section className="relative overflow-hidden bg-ink-900 py-14 text-white">
        <div className="bg-hero-grid absolute inset-0 opacity-30" style={{ backgroundSize: '22px 22px' }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Suivi de colis &amp; véhicule</h1>
          <p className="mt-3 text-ink-100/70">Entrez votre code de suivi pour connaître le statut de votre envoi en temps réel.</p>
          <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 rounded-xl bg-white p-2 shadow-glow sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <SearchIcon className="h-5 w-5 shrink-0 text-ink-600/50" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code de suivi (ex : TRK-AB12CD34)"
                className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-600/40 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Recherche…' : 'Rechercher'}
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
                  Statut : {tone.label}
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{result.type === 'VEHICLE' ? 'Véhicule' : 'Colis'}</span>
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

            {/* Shipment info grid */}
            {hasShipment && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                  <TruckIcon className="h-4 w-4" /> Informations d'expédition
                </h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                  <InfoCell label="Origine" value={d?.originCity} />
                  <InfoCell label="Destination" value={d?.destinationCity} />
                  <InfoCell label="Transporteur" value={d?.carrier} />
                  <InfoCell label="Mode d'expédition" value={d?.shipmentMode} />
                  <InfoCell label="Référence transporteur" value={d?.carrierReferenceNo} />
                  <InfoCell label="Mode de paiement" value={d?.paymentMode} />
                  <InfoCell label="Frais totaux" value={d?.totalFreight !== undefined ? `${d.totalFreight}` : undefined} />
                  <InfoCell label="Livraison prévue" value={d?.expectedDeliveryDate} />
                  <InfoCell label="Date de ramassage" value={d?.pickupDate} />
                  <InfoCell label="Heure de ramassage" value={d?.pickupTime} />
                  <InfoCell label="Heure de départ" value={d?.departureTime} />
                </dl>
                {d?.comments && (
                  <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{d.comments}</p>
                )}
              </div>
            )}

            {/* Package / vehicle details */}
            {hasPackage && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-card">
                <h2 className="flex items-center gap-2 px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                  <PackageIcon className="h-4 w-4" /> Détails du colis
                </h2>
                <div className="overflow-x-auto px-6 py-4">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-700/50">
                        <th className="py-2 pr-4">Catégorie</th>
                        <th className="py-2 pr-4">Description</th>
                        <th className="py-2 pr-4">Dimensions (L×l×H cm)</th>
                        <th className="py-2 pr-4">Poids</th>
                        <th className="py-2">Valeur déclarée</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4">{d?.category ?? '—'}</td>
                        <td className="py-2 pr-4">{d?.description ?? '—'}</td>
                        <td className="py-2 pr-4">
                          {d?.lengthCm && d?.widthCm && d?.heightCm ? `${d.lengthCm} × ${d.widthCm} × ${d.heightCm}` : '—'}
                        </td>
                        <td className="py-2 pr-4">{d?.weightKg !== undefined ? `${d.weightKg} kg` : '—'}</td>
                        <td className="py-2">{d?.declaredValue !== undefined ? d.declaredValue : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                  {d?.fragile && (
                    <span className="mt-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      ⚠ Colis fragile
                    </span>
                  )}
                  {(d?.plateNumber || d?.vehicleModel || d?.vehicleColor) && (
                    <dl className="mt-4 grid grid-cols-3 gap-4">
                      <InfoCell label="Plaque" value={d?.plateNumber} />
                      <InfoCell label="Modèle" value={d?.vehicleModel} />
                      <InfoCell label="Couleur" value={d?.vehicleColor} />
                    </dl>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                <ClockIcon className="h-4 w-4" /> Historique
              </h2>
              <ol className="space-y-0">
                {result.statusHistory.map((h, idx) => {
                  const isLast = idx === result.statusHistory.length - 1;
                  return (
                    <li key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${isLast ? 'bg-brand-600' : 'bg-ink-900/20'}`} />
                        {idx < result.statusHistory.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-900/10" />}
                      </div>
                      <div className="-mt-1">
                        <div className="text-sm font-semibold">{h.status}</div>
                        <div className="text-xs text-ink-700/50">{new Date(h.createdAt).toLocaleString('fr-FR')}</div>
                        {h.note && <div className="mt-1 text-sm text-ink-700/70">{h.note}</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Map */}
            {result.lastPosition && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-card">
                <h2 className="flex items-center gap-2 px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-ink-700/60">
                  <MapPinIcon className="h-4 w-4" /> Position actuelle
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
          </div>
        )}

        {!result && !error && (
          <p className="py-16 text-center text-sm text-ink-700/50">
            Aucun envoi recherché pour le moment — entrez un code de suivi ci-dessus.
          </p>
        )}
      </main>
    </div>
  );
}
