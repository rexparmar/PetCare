import { z } from "zod";
import { atLeastOneField, dateOnly, optionalText } from "./common.js";

const fields = {
  recordType: z.enum([
    "VACCINATION",
    "MEDICAL_CHECKUP",
    "TREATMENT",
    "SURGERY",
    "OTHER",
  ]),
  title: z.string().trim().min(1).max(150),
  description: optionalText(5000),
  recordDate: dateOnly,
  veterinarianName: optionalText(150),
};

export const createHealthRecordSchema = z.object(fields);
export const updateHealthRecordSchema = atLeastOneField(fields);
