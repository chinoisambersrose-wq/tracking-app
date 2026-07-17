import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { MapView } from '../../components/MapView';

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

export default function PublicTrackingPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      const { data } = await api.get<TrackingResult>(`/public/track/${code.trim()}`);
      setResult(data);
    } catch {
      setError('Aucun résultat pour ce code de suivi.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Suivi de colis / véhicule</h1>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code de suivi (ex: TRK-AB12CD34)"
          className="flex-1 rounded border px-3 py-2"
          required
        />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Rechercher
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium">{result.label ?? result.publicCode}</div>
            <div className="text-sm text-gray-500">{result.organizationName}</div>
            <div className="mt-2 text-lg">Statut actuel : {result.currentStatus}</div>
          </div>

          {result.details && Object.keys(result.details).length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-2 font-medium">Détails</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                {result.details.category && <li>Catégorie : {result.details.category}</li>}
                {result.details.weightKg !== undefined && <li>Poids : {result.details.weightKg} kg</li>}
                {result.details.lengthCm && result.details.widthCm && result.details.heightCm && (
                  <li>
                    Dimensions : {result.details.lengthCm} × {result.details.widthCm} × {result.details.heightCm} cm
                  </li>
                )}
                {result.details.declaredValue !== undefined && <li>Valeur déclarée : {result.details.declaredValue}</li>}
                {result.details.fragile && <li className="font-medium text-orange-600">Colis fragile</li>}
                {result.details.description && <li>Description : {result.details.description}</li>}
                {result.details.plateNumber && <li>Plaque : {result.details.plateNumber}</li>}
                {result.details.vehicleModel && <li>Modèle : {result.details.vehicleModel}</li>}
                {result.details.vehicleColor && <li>Couleur : {result.details.vehicleColor}</li>}
              </ul>
            </div>
          )}

          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-medium">Historique</h2>
            <ul className="space-y-1 text-sm">
              {result.statusHistory.map((h, idx) => (
                <li key={idx}>
                  {new Date(h.createdAt).toLocaleString('fr-FR')} — {h.status}
                  {h.note ? ` (${h.note})` : ''}
                </li>
              ))}
            </ul>
          </div>

          {result.lastPosition && (
            <div className="h-96">
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
          )}
        </div>
      )}
    </div>
  );
}
