import { z } from "zod";
import { atLeastOneField, optionalText } from "./common.js";

const isoTimestamp = z.string().datetime({ offset: true });
const fields = {
  petId: z.string().uuid(),
  appointmentDate: isoTimestamp,
  providerName: z.string().trim().min(1).max(150),
  reason: z.string().trim().min(1).max(200),
  notes: optionalText(5000),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
};

export const createAppointmentSchema = z.object({
  petId: fields.petId,
  appointmentDate: fields.appointmentDate.refine(
    (value) => new Date(value) > new Date(),
    {
      message: "New appointments must be scheduled in the future.",
    },
  ),
  providerName: fields.providerName,
  reason: fields.reason,
  notes: fields.notes,
});
export const updateAppointmentSchema = atLeastOneField(fields);
