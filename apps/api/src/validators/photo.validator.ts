import { z } from "zod";

// The photo itself is the raw request body; these values describe it.
export const uploadPhotoQuerySchema = z.object({
  width: z.coerce.number().int().min(1).max(10000),
  height: z.coerce.number().int().min(1).max(10000),
  caption: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || null),
});

export const updatePhotoSchema = z.object({
  caption: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .transform((value) => value || null),
});
