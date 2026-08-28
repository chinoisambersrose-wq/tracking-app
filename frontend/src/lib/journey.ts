import { useEffect, useState } from 'react';

/** Sous-ensemble des métadonnées d'un TrackingItem lié au trajet simulé. */
export interface JourneyMetadata {
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  journeySpeedKmh?: number;
  departureAt?: string;
  arrivalAt?: string;
  journeyDistanceKm?: number;
}

export interface SimulatedPosition {
  lat: number;
  lng: number;
  /** Progression du trajet, de 0 (départ) à 1 (arrivée). */
  progress: number;
  arrived: boolean;
  /** Minutes restantes avant l'arrivée estimée (0 si déjà arrivé). */
  etaMinutes: number;
}

/** Un trajet simulé est "actif" dès que les 4 coordonnées, la vitesse et l'heure de départ sont connues. */
export function hasJourney(m?: JourneyMetadata | null): boolean {
  return !!(
    m &&
    typeof m.originLat === 'number' &&
    typeof m.originLng === 'number' &&
    typeof m.destinationLat === 'number' &&
    typeof m.destinationLng === 'number' &&
    typeof m.journeySpeedKmh === 'number' &&
    m.departureAt &&
    m.arrivalAt
  );
}

/**
 * Calcule la position interpolée (ligne droite) du colis entre le point de
 * départ et le point d'arrivée, en fonction du temps écoulé depuis
 * `departureAt` par rapport à `arrivalAt` (calculé côté serveur à partir de
 * la distance et de la vitesse choisies par l'admin). Se recalcule chaque
 * seconde tant que le trajet n'est pas terminé — purement côté client, pas
 * besoin d'appel serveur ni de websocket pour l'animation elle-même.
 */
export function useSimulatedPosition(metadata?: JourneyMetadata | null): SimulatedPosition | null {
  const [, forceTick] = useState(0);
  const active = hasJourney(metadata);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active, metadata?.departureAt, metadata?.arrivalAt]);

  if (!active || !metadata) return null;

  const departure = new Date(metadata.departureAt as string).getTime();
  const arrival = new Date(metadata.arrivalAt as string).getTime();
  const now = Date.now();
  const total = arrival - departure;
  const progress = total <= 0 ? 1 : Math.min(1, Math.max(0, (now - departure) / total));

  const originLat = metadata.originLat as number;
  const originLng = metadata.originLng as number;
  const destinationLat = metadata.destinationLat as number;
  const destinationLng = metadata.destinationLng as number;

  const lat = originLat + (destinationLat - originLat) * progress;
  const lng = originLng + (destinationLng - originLng) * progress;
  const arrived = progress >= 1;
  const etaMinutes = arrived ? 0 : Math.max(0, Math.round((arrival - now) / 60000));

  return { lat, lng, progress, arrived, etaMinutes };
}

/** Formate un nombre de minutes en "Xh Ymin" ou "Ymin". */
export function formatEta(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
