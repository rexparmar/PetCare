import type { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseTimestamp } from "../utils/date.js";
import { getOwnedPet } from "./pet.service.js";

export type ActivityInput = {
  activityType: ActivityType;
  activityDate: string;
  durationMinutes?: number | null;
  distanceKm?: number | null;
  notes?: string | null;
};

function toData(
  input: Partial<ActivityInput>,
): Prisma.ActivityUncheckedUpdateInput {
  return {
    ...input,
    ...(input.activityDate !== undefined
      ? { activityDate: parseTimestamp(input.activityDate) }
      : {}),
  };
}

export async function listActivities(ownerId: string, petId: string) {
  await getOwnedPet(ownerId, petId);
  return prisma.activity.findMany({
    where: { petId },
    orderBy: { activityDate: "desc" },
    take: 200,
  });
}

export async function createActivity(
  ownerId: string,
  petId: string,
  input: ActivityInput,
) {
  await getOwnedPet(ownerId, petId);
  return prisma.activity.create({
    data: {
      petId,
      activityType: input.activityType,
      activityDate: parseTimestamp(input.activityDate),
      durationMinutes: input.durationMinutes,
      distanceKm: input.distanceKm,
      notes: input.notes,
    },
  });
}

async function getOwnedActivity(
  ownerId: string,
  petId: string,
  activityId: string,
) {
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, petId, pet: { ownerId } },
  });
  if (!activity)
    throw new AppError(404, "ACTIVITY_NOT_FOUND", "Activity was not found.");
  return activity;
}

export async function updateActivity(
  ownerId: string,
  petId: string,
  activityId: string,
  input: Partial<ActivityInput>,
) {
  await getOwnedActivity(ownerId, petId, activityId);
  return prisma.activity.update({
    where: { id: activityId },
    data: toData(input),
  });
}

export async function deleteActivity(
  ownerId: string,
  petId: string,
  activityId: string,
) {
  await getOwnedActivity(ownerId, petId, activityId);
  await prisma.activity.delete({ where: { id: activityId } });
}
