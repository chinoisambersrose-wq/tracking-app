import { z } from 'zod';

/**
 * Métadonnées structurées d'un élément de tracking. Les champs pertinents
 * dépendent du type (PARCEL vs VEHICLE) mais on garde un schéma unique et
 * souple : tous les champs sont optionnels, les champs non fournis sont
 * simplement absents.
 *
 * Choix produit : à la demande explicite du client, les coordonnées de
 * l'expéditeur et du destinataire (nom, téléphone, adresse, email) sont
 * exposées sur la page de suivi publique (voir PUBLIC_METADATA_FIELDS et
 * public-tracking.controller.ts), à l'image des sites de transporteurs
 * classiques utilisés comme référence de design.
 */
export const trackingItemMetadataSchema = z
  .object({
    // --- Colis (PARCEL) ---
    category: z.string().min(1).max(60).optional(), // ex: Électronique, Documents, Animaux vivants, Véhicule, Meubles...
    weightKg: z.number().positive().max(50000).optional(),
    declaredValue: z.number().nonnegative().max(1_000_000_000).optional(),
    fragile: z.boolean().optional(),
    lengthCm: z.number().positive().max(2000).optional(),
    widthCm: z.number().positive().max(2000).optional(),
    heightCm: z.number().positive().max(2000).optional(),
    description: z.string().max(500).optional(),

    // --- Contact expéditeur / destinataire (affiché publiquement, à la
    // manière d'un transporteur classique type FedEx/DHL) ---
    senderName: z.string().max(120).optional(),
    senderPhone: z.string().max(30).optional(),
    senderAddress: z.string().max(255).optional(),
    senderEmail: z.string().max(160).optional(),
    recipientName: z.string().max(120).optional(),
    recipientPhone: z.string().max(30).optional(),
    recipientAddress: z.string().max(255).optional(),
    recipientEmail: z.string().max(160).optional(),

    // --- Véhicule (VEHICLE) ---
    plateNumber: z.string().max(20).optional(),
    vehicleModel: z.string().max(60).optional(),
    vehicleColor: z.string().max(40).optional(),
    driverName: z.string().max(120).optional(),
    driverPhone: z.string().max(30).optional(),

    // --- Expédition / logistique (affiché publiquement, à la manière d'un
    // transporteur classique : transporteur, mode, référence, itinéraire...) ---
    carrier: z.string().max(80).optional(), // ex: FedEx, DHL, transporteur interne...
    shipmentMode: z.string().max(40).optional(), // ex: Route, Maritime, Aérien
    carrierReferenceNo: z
      .string()
      .regex(/^\d{14,}$/, 'La référence transporteur doit contenir au moins 14 chiffres.')
      .optional(),
    paymentMode: z.string().max(60).optional(), // ex: Virement, Paiement à la livraison
    totalFreight: z.number().nonnegative().max(1_000_000_000).optional(),
    originCity: z.string().max(120).optional(),
    destinationCity: z.string().max(120).optional(),
    expectedDeliveryDate: z.string().max(20).optional(), // ISO date (YYYY-MM-DD)
    pickupDate: z.string().max(20).optional(),
    pickupTime: z.string().max(10).optional(),
    departureTime: z.string().max(10).optional(),
    comments: z.string().max(500).optional(), // remarque publique (ex: consignes de livraison)

    // --- Trajet simulé (le colis se déplace sur la carte du point de départ
    // vers le point d'arrivée, à la vitesse choisie par l'admin). journeyDistanceKm
    // et arrivalAt sont recalculés côté serveur à chaque écriture : toute valeur
    // envoyée par le client pour ces deux champs est ignorée (voir tracking-items.service.ts).
    originLat: z.number().min(-90).max(90).optional(),
    originLng: z.number().min(-180).max(180).optional(),
    destinationLat: z.number().min(-90).max(90).optional(),
    destinationLng: z.number().min(-180).max(180).optional(),
    journeySpeedKmh: z.number().positive().max(2000).optional(),
    departureAt: z.string().min(1).optional(), // ISO 8601
    arrivalAt: z.string().min(1).optional(), // calculé par le serveur
    journeyDistanceKm: z.number().nonnegative().optional(), // calculé par le serveur
  })
  .partial();

export type TrackingItemMetadata = z.infer<typeof trackingItemMetadataSchema>;

/** Sous-ensemble sûr à exposer sans authentification sur la page de suivi publique. */
export const PUBLIC_METADATA_FIELDS = [
  'category',
  'weightKg',
  'declaredValue',
  'fragile',
  'lengthCm',
  'widthCm',
  'heightCm',
  'description',
  'plateNumber',
  'vehicleModel',
  'vehicleColor',
  'senderName',
  'senderPhone',
  'senderAddress',
  'senderEmail',
  'recipientName',
  'recipientPhone',
  'recipientAddress',
  'recipientEmail',
  'carrier',
  'shipmentMode',
  'carrierReferenceNo',
  'paymentMode',
  'totalFreight',
  'originCity',
  'destinationCity',
  'expectedDeliveryDate',
  'pickupDate',
  'pickupTime',
  'departureTime',
  'comments',
  'originLat',
  'originLng',
  'destinationLat',
  'destinationLng',
  'journeySpeedKmh',
  'departureAt',
  'arrivalAt',
  'journeyDistanceKm',
] as const;

export function toPublicMetadata(metadata: unknown): Partial<TrackingItemMetadata> {
  if (!metadata || typeof metadata !== 'object') return {};
  const source = metadata as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const field of PUBLIC_METADATA_FIELDS) {
    if (source[field] !== undefined) result[field] = source[field];
  }
  return result;
}
