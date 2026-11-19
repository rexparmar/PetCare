import { z } from "zod";

export const linkClinicSchema = z.object({
  clinicId: z.string().trim().min(1).max(50),
});

export const submitRequestSchema = z.object({
  appointmentId: z.string().uuid(),
});
