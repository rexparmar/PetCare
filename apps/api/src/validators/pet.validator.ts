import { z } from "zod";
import { atLeastOneField, dateOnly, optionalText } from "./common.js";

const petFields = {
  name: z.string().trim().min(1).max(100),
  species: z.string().trim().min(1).max(80),
  breed: optionalText(120),
  dateOfBirth: dateOnly.optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  weight: z.number().positive().max(500).optional().nullable(),
  medicalNotes: optionalText(5000),
};

export const createPetSchema = z.object(petFields);
export const updatePetSchema = atLeastOneField(petFields);
