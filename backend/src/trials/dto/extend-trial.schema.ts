import { z } from 'zod';

export const extendTrialSchema = z.object({
  additionalDays: z.number().int().positive().max(365),
});

export type ExtendTrialDto = z.infer<typeof extendTrialSchema>;
