import { z } from 'zod';

export const createAgentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

export type CreateAgentDto = z.infer<typeof createAgentSchema>;
