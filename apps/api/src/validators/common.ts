import { z } from "zod";

export const idParamsSchema = z.object({ id: z.string().uuid() });
export const petIdParamsSchema = z.object({ petId: z.string().uuid() });
export const healthRecordParamsSchema = z.object({
  petId: z.string().uuid(),
  recordId: z.string().uuid(),
});

export const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .nullable()
    .transform((value) => value || null);

export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");

export function atLeastOneField<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required.",
    });
}

export const medicationParamsSchema = z.object({
  petId: z.string().uuid(),
  medicationId: z.string().uuid(),
});

export const activityParamsSchema = z.object({
  petId: z.string().uuid(),
  activityId: z.string().uuid(),
});

export const photoParamsSchema = z.object({
  petId: z.string().uuid(),
  photoId: z.string().uuid(),
});
