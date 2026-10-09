import type { Gender, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseDateOnly } from "../utils/date.js";

export type PetInput = {
  name: string;
  species: string;
  breed?: string | null;
  dateOfBirth?: string | null;
  gender: Gender;
  weight?: number | null;
  medicalNotes?: string | null;
};

function toData(input: Partial<PetInput>): Prisma.PetUncheckedUpdateInput {
  return {
    ...input,
    ...(input.dateOfBirth !== undefined
      ? {
          dateOfBirth: input.dateOfBirth
            ? parseDateOnly(input.dateOfBirth)
            : null,
        }
      : {}),
  };
}

export function listPets(ownerId: string) {
  return prisma.pet.findMany({
    where: { ownerId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { healthRecords: true, appointments: true } },
    },
  });
}

export async function getOwnedPet(ownerId: string, id: string) {
  const pet = await prisma.pet.findFirst({ where: { id, ownerId } });
  if (!pet) throw new AppError(404, "PET_NOT_FOUND", "Pet was not found.");
  return pet;
}

export function createPet(ownerId: string, input: PetInput) {
  return prisma.pet.create({
    data: {
      ownerId,
      name: input.name,
      species: input.species,
      breed: input.breed,
      dateOfBirth: input.dateOfBirth ? parseDateOnly(input.dateOfBirth) : null,
      gender: input.gender,
      weight: input.weight,
      medicalNotes: input.medicalNotes,
    },
  });
}

export async function updatePet(
  ownerId: string,
  id: string,
  input: Partial<PetInput>,
) {
  await getOwnedPet(ownerId, id);
  return prisma.pet.update({ where: { id }, data: toData(input) });
}

export async function deletePet(ownerId: string, id: string) {
  await getOwnedPet(ownerId, id);
  await prisma.pet.delete({ where: { id } });
}
