import { z } from 'zod';

export const updateWhatsappSchema = z.object({
  whatsappPhone: z.string().min(6).max(30).nullable(),
});

export type UpdateWhatsappDto = z.infer<typeof updateWhatsappSchema>;
