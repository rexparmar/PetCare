import { z } from "zod";
import { isValidTimeZone } from "../utils/time.js";
import { atLeastOneField } from "./common.js";

export const updatePreferencesSchema = atLeastOneField({
  timeZone: z
    .string()
    .max(64)
    .refine(isValidTimeZone, { message: "Unknown time zone." }),
  medicationReminders: z.boolean(),
  appointmentReminders: z.boolean(),
  appointmentLeadHours: z.number().int().min(1).max(72),
});
