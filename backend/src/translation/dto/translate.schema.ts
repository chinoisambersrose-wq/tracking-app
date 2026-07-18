import { z } from 'zod';

export const translateSchema = z.object({
  texts: z.array(z.string().max(500)).min(1).max(30),
  target: z.enum(['fr', 'en', 'de']),
  source: z.enum(['fr', 'en', 'de']).optional().default('fr'),
});

export type TranslateDto = z.infer<typeof translateSchema>;
