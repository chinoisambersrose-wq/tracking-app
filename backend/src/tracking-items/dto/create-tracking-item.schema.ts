import { z } from 'zod';
import { trackingItemMetadataSchema } from './tracking-item-metadata.schema';

export const createTrackingItemSchema = z.object({
  type: z.enum(['PARCEL', 'VEHICLE']),
  label: z.string().min(1).optional(),
  initialStatus: z.string().min(1).default('RECEIVED'),
  assignedAgentId: z.string().uuid().optional(),
  metadata: trackingItemMetadataSchema.optional(),
});

export type CreateTrackingItemDto = z.infer<typeof createTrackingItemSchema>;
