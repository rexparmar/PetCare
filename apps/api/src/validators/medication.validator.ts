import { z } from "zod";
import { atLeastOneField, dateOnly, optionalText } from "./common.js";

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the HH:MM 24-hour format.");

const fields = {
  name: z.string().trim().min(1).max(120),
  dosage: z.string().trim().min(1).max(80),
  frequency: z.enum([
    "ONCE_DAILY",
    "TWICE_DAILY",
    "THREE_TIMES_DAILY",
    "AS_NEEDED",
  ]),
  timesOfDay: z.array(timeOfDay).max(3),
  startDate: dateOnly,
  endDate: dateOnly.optional().nullable(),
  instructions: optionalText(2000),
  isActive: z.boolean(),
};

export const createMedicationSchema = z.object({
  ...fields,
  timesOfDay: fields.timesOfDay.default([]),
  isActive: fields.isActive.default(true),
});
export const updateMedicationSchema = atLeastOneField(fields);
