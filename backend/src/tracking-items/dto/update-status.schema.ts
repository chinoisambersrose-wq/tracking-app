import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().optional(),
});

export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
