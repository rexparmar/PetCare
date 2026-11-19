import { z } from "zod";
import { atLeastOneField, optionalText } from "./common.js";

// Activities record things that already happened, so a small clock-skew
// allowance is the only future time accepted.
const notInFuture = (value: string) =>
  new Date(value).getTime() <= Date.now() + 5 * 60_000;

const fields = {
  activityType: z.enum([
    "WALK",
    "PLAY",
    "FEEDING",
    "GROOMING",
    "TRAINING",
    "OTHER",
  ]),
  activityDate: z
    .string()
    .datetime({ offset: true })
    .refine(notInFuture, { message: "Activities cannot be in the future." }),
  durationMinutes: z.number().int().min(1).max(1440).optional().nullable(),
  distanceKm: z.number().positive().max(500).optional().nullable(),
  notes: optionalText(2000),
};

export const createActivitySchema = z.object(fields);
export const updateActivitySchema = atLeastOneField(fields);
