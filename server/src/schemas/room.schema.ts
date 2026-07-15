import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name must be under 50 characters')
    .trim(),
  language: z.string().optional().default('cpp'),
});

export const updateRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name must be under 50 characters')
    .trim(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const updateCodeSchema = z.object({
  code: z.string(),
  language: z.string().min(1),
});
export type UpdateCodeInput = z.infer<typeof updateCodeSchema>;
