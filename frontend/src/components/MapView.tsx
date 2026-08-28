import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Icônes par défaut Leaflet cassées par le bundler Vite : on les redéfinit.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icône distincte (pastille orange) pour la position en cours de sélection,
// pas encore enregistrée, afin de la différencier des positions confirmées.
// On utilise un divIcon (CSS pur) plutôt qu'une image externe pour éviter
// toute dépendance à un asset qui n'existe pas dans le dist Leaflet standard.
const pendingIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#f97316;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Icônes du trajet simulé : point de départ (vert), point d'arrivée
// (carré rouge), et colis en mouvement (pastille bleue avec émoji).
const originIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:3px;background:#ef4444;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const movingIcon = L.divIcon({
  className: '',
  html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);font-size:14px;">📦</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const VARIANT_ICONS = {
  origin: originIcon,
  destination: destinationIcon,
  moving: movingIcon,
} as const;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status?: string;
  /** Style du marqueur : par défaut l'icône Leaflet standard (pin bleu). */
  variant?: 'default' | 'origin' | 'destination' | 'moving';
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapView({
  markers,
  center = [4.0511, 9.7679], // Douala par défaut, à ajuster
  zoom = 6,
  onMapClick,
  pendingMarker,
  route,
}: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  /** Si fourni, la carte devient cliquable : chaque clic renvoie (lat, lng). */
  onMapClick?: (lat: number, lng: number) => void;
  /** Marqueur temporaire (orange) affiché avant confirmation de l'enregistrement. */
  pendingMarker?: { lat: number; lng: number } | null;
  /** Ligne pointillée reliant deux points ou plus (ex : trajet départ → arrivée). */
  route?: { lat: number; lng: number }[];
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`h-full w-full rounded-lg ${onMapClick ? 'cursor-crosshair' : ''}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMapClick && <ClickHandler onClick={onMapClick} />}
      {route && route.length >= 2 && (
        <Polyline
          positions={route.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: '#2563eb', weight: 3, dashArray: '6 8', opacity: 0.7 }}
        />
      )}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={m.variant && m.variant !== 'default' ? VARIANT_ICONS[m.variant] : undefined}
        >
          <Popup>
            <strong>{m.label}</strong>
            {m.status && <div>Statut : {m.status}</div>}
          </Popup>
        </Marker>
      ))}
      {pendingMarker && (
        <Marker position={[pendingMarker.lat, pendingMarker.lng]} icon={pendingIcon}>
          <Popup>Nouvelle position (non enregistrée)</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
