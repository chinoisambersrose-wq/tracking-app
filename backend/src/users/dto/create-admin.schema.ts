import { z } from 'zod';

export const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  organizationName: z.string().min(2),
  trackingMode: z.enum(['PARCEL', 'GPS', 'BOTH']).default('PARCEL'),
  trialDurationDays: z.number().int().positive().max(365).default(14),
});

export type CreateAdminDto = z.infer<typeof createAdminSchema>;
