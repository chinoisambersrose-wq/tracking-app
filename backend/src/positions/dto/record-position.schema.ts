import { z } from 'zod';

export const recordPositionSchema = z.object({
  trackingItemId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional(),
  heading: z.number().optional(),
  accuracy: z.number().optional(),
});

export type RecordPositionDto = z.infer<typeof recordPositionSchema>;
