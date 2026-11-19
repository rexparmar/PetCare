import type { MedicationFrequency, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseDateOnly } from "../utils/date.js";
import { getOwnedPet } from "./pet.service.js";

export type MedicationInput = {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  timesOfDay: string[];
  startDate: string;
  endDate?: string | null;
  instructions?: string | null;
  isActive: boolean;
};

const dosesPerDay: Record<MedicationFrequency, number> = {
  ONCE_DAILY: 1,
  TWICE_DAILY: 2,
  THREE_TIMES_DAILY: 3,
  AS_NEEDED: 0,
};

function invalid(message: string): never {
  throw new AppError(400, "VALIDATION_ERROR", message);
}

// Cross-field rules that a single-field schema cannot express. They run on the
// final merged values so partial updates are checked against stored data.
function assertSchedule(schedule: {
  frequency: MedicationFrequency;
  timesOfDay: string[];
  startDate: Date;
  endDate: Date | null;
}) {
  const expected = dosesPerDay[schedule.frequency];
  if (schedule.timesOfDay.length !== expected) {
    invalid(
      expected === 0
        ? "As-needed medications must not have scheduled times."
        : `This frequency needs exactly ${expected} time(s) of day.`,
    );
  }
  if (new Set(schedule.timesOfDay).size !== schedule.timesOfDay.length) {
    invalid("Times of day must be different from each other.");
  }
  if (schedule.endDate && schedule.endDate < schedule.startDate) {
    invalid("End date cannot be before the start date.");
  }
}

const sortTimes = (times: string[]) => [...times].sort();

export async function listMedications(ownerId: string, petId: string) {
  await getOwnedPet(ownerId, petId);
  return prisma.medication.findMany({
    where: { petId },
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }, { name: "asc" }],
  });
}

export async function createMedication(
  ownerId: string,
  petId: string,
  input: MedicationInput,
) {
  await getOwnedPet(ownerId, petId);
  const startDate = parseDateOnly(input.startDate);
  const endDate = input.endDate ? parseDateOnly(input.endDate) : null;
  const timesOfDay = sortTimes(input.timesOfDay);
  assertSchedule({
    frequency: input.frequency,
    timesOfDay,
    startDate,
    endDate,
  });
  return prisma.medication.create({
    data: {
      petId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency,
      timesOfDay,
      startDate,
      endDate,
      instructions: input.instructions,
      isActive: input.isActive,
    },
  });
}

async function getOwnedMedication(
  ownerId: string,
  petId: string,
  medicationId: string,
) {
  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, petId, pet: { ownerId } },
  });
  if (!medication)
    throw new AppError(
      404,
      "MEDICATION_NOT_FOUND",
      "Medication was not found.",
    );
  return medication;
}

export async function updateMedication(
  ownerId: string,
  petId: string,
  medicationId: string,
  input: Partial<MedicationInput>,
) {
  const existing = await getOwnedMedication(ownerId, petId, medicationId);
  const startDate = input.startDate
    ? parseDateOnly(input.startDate)
    : existing.startDate;
  const endDate =
    input.endDate !== undefined
      ? input.endDate
        ? parseDateOnly(input.endDate)
        : null
      : existing.endDate;
  const frequency = input.frequency ?? existing.frequency;
  const timesOfDay = sortTimes(input.timesOfDay ?? existing.timesOfDay);
  assertSchedule({ frequency, timesOfDay, startDate, endDate });

  const data: Prisma.MedicationUncheckedUpdateInput = {
    frequency,
    timesOfDay,
    startDate,
    endDate,
  };
  if (input.name !== undefined) data.name = input.name;
  if (input.dosage !== undefined) data.dosage = input.dosage;
  if (input.instructions !== undefined) data.instructions = input.instructions;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  return prisma.medication.update({ where: { id: medicationId }, data });
}

export async function deleteMedication(
  ownerId: string,
  petId: string,
  medicationId: string,
) {
  await getOwnedMedication(ownerId, petId, medicationId);
  await prisma.medication.delete({ where: { id: medicationId } });
}
