import { z } from 'zod';

export const executeSchema = z.object({
  language: z.enum(['cpp', 'python', 'java', 'javascript']),
  code: z.string().min(1, 'Code cannot be empty'),
  stdin: z.string().optional(),
});

export type ExecuteRequest = z.infer<typeof executeSchema>;
