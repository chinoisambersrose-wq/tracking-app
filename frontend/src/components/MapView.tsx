import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status?: string;
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
}: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  /** Si fourni, la carte devient cliquable : chaque clic renvoie (lat, lng). */
  onMapClick?: (lat: number, lng: number) => void;
  /** Marqueur temporaire (orange) affiché avant confirmation de l'enregistrement. */
  pendingMarker?: { lat: number; lng: number } | null;
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
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
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
