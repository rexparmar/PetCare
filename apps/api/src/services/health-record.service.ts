import type { HealthRecordType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseDateOnly } from "../utils/date.js";
import { getOwnedPet } from "./pet.service.js";

export type HealthRecordInput = {
  recordType: HealthRecordType;
  title: string;
  description?: string | null;
  recordDate: string;
  veterinarianName?: string | null;
};

function toData(
  input: Partial<HealthRecordInput>,
): Prisma.HealthRecordUncheckedUpdateInput {
  return {
    ...input,
    ...(input.recordDate !== undefined
      ? { recordDate: parseDateOnly(input.recordDate) }
      : {}),
  };
}

export async function listHealthRecords(ownerId: string, petId: string) {
  await getOwnedPet(ownerId, petId);
  return prisma.healthRecord.findMany({
    where: { petId },
    orderBy: { recordDate: "desc" },
  });
}

export async function createHealthRecord(
  ownerId: string,
  petId: string,
  input: HealthRecordInput,
) {
  await getOwnedPet(ownerId, petId);
  return prisma.healthRecord.create({
    data: {
      petId,
      recordType: input.recordType,
      title: input.title,
      description: input.description,
      recordDate: parseDateOnly(input.recordDate),
      veterinarianName: input.veterinarianName,
    },
  });
}

async function getOwnedRecord(
  ownerId: string,
  petId: string,
  recordId: string,
) {
  const record = await prisma.healthRecord.findFirst({
    where: { id: recordId, petId, pet: { ownerId } },
  });
  if (!record)
    throw new AppError(
      404,
      "HEALTH_RECORD_NOT_FOUND",
      "Health record was not found.",
    );
  return record;
}

export async function updateHealthRecord(
  ownerId: string,
  petId: string,
  recordId: string,
  input: Partial<HealthRecordInput>,
) {
  await getOwnedRecord(ownerId, petId, recordId);
  return prisma.healthRecord.update({
    where: { id: recordId },
    data: toData(input),
  });
}

export async function deleteHealthRecord(
  ownerId: string,
  petId: string,
  recordId: string,
) {
  await getOwnedRecord(ownerId, petId, recordId);
  await prisma.healthRecord.delete({ where: { id: recordId } });
}
