import { z } from 'zod';

/**
 * Métadonnées structurées d'un élément de tracking. Les champs pertinents
 * dépendent du type (PARCEL vs VEHICLE) mais on garde un schéma unique et
 * souple : tous les champs sont optionnels, les champs non fournis sont
 * simplement absents. Certains champs (téléphones, adresse) sont considérés
 * sensibles et ne doivent PAS être exposés sur la page de suivi publique
 * (voir public-tracking.controller.ts).
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

    // --- Contact (sensible, non exposé publiquement) ---
    senderName: z.string().max(120).optional(),
    senderPhone: z.string().max(30).optional(),
    recipientName: z.string().max(120).optional(),
    recipientPhone: z.string().max(30).optional(),
    recipientAddress: z.string().max(255).optional(),

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
    carrierReferenceNo: z.string().max(80).optional(),
    paymentMode: z.string().max(60).optional(), // ex: Virement, Paiement à la livraison
    totalFreight: z.number().nonnegative().max(1_000_000_000).optional(),
    originCity: z.string().max(120).optional(),
    destinationCity: z.string().max(120).optional(),
    expectedDeliveryDate: z.string().max(20).optional(), // ISO date (YYYY-MM-DD)
    pickupDate: z.string().max(20).optional(),
    pickupTime: z.string().max(10).optional(),
    departureTime: z.string().max(10).optional(),
    comments: z.string().max(500).optional(), // remarque publique (ex: consignes de livraison)
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
