import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface TrackingItem {
  id: string;
  label: string | null;
  publicCode: string;
  currentStatus: string;
}

const STATUS_OPTIONS = ['RECEIVED', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];

export default function AgentPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [sharingGps, setSharingGps] = useState(false);

  async function loadItems() {
    const { data } = await api.get<TrackingItem[]>('/tracking-items');
    setItems(data);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.patch(`/tracking-items/${id}/status`, { status });
    loadItems();
  }

  function toggleGpsSharing(trackingItemId: string) {
    if (sharingGps) {
      setSharingGps(false);
      return;
    }
    if (!navigator.geolocation) {
      alert('Géolocalisation non disponible sur cet appareil.');
      return;
    }
    setSharingGps(true);
    navigator.geolocation.watchPosition(
      async (pos) => {
        await api.post('/positions', {
          trackingItemId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed: pos.coords.speed ?? undefined,
          heading: pos.coords.heading ?? undefined,
          accuracy: pos.coords.accuracy ?? undefined,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Agent — {user?.fullName}</h1>
        <button onClick={logout} className="text-sm text-gray-500 hover:underline">
          Déconnexion
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-3">
            <div className="font-medium">{item.label ?? item.publicCode}</div>
            <div className="mb-2 text-sm text-gray-500">Statut actuel : {item.currentStatus}</div>

            <select
              className="mb-2 w-full rounded border px-2 py-1.5 text-sm"
              value={item.currentStatus}
              onChange={(e) => updateStatus(item.id, e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              onClick={() => toggleGpsSharing(item.id)}
              className={`w-full rounded py-1.5 text-sm text-white ${
                sharingGps ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {sharingGps ? 'Arrêter le partage GPS' : 'Partager ma position'}
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">Aucun élément assigné.</p>}
      </div>
    </div>
  );
}
