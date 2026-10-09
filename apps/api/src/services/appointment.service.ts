import type { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseTimestamp } from "../utils/date.js";
import { getOwnedPet } from "./pet.service.js";

export type AppointmentInput = {
  petId: string;
  appointmentDate: string;
  providerName: string;
  reason: string;
  notes?: string | null;
  status?: AppointmentStatus;
};

function toData(
  input: Partial<AppointmentInput>,
): Prisma.AppointmentUncheckedUpdateInput {
  return {
    ...input,
    ...(input.appointmentDate !== undefined
      ? { appointmentDate: parseTimestamp(input.appointmentDate) }
      : {}),
  };
}

export function listAppointments(ownerId: string) {
  return prisma.appointment.findMany({
    where: { pet: { ownerId } },
    orderBy: { appointmentDate: "asc" },
    include: { pet: { select: { id: true, name: true, species: true } } },
  });
}

export async function getOwnedAppointment(ownerId: string, id: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, pet: { ownerId } },
    include: { pet: { select: { id: true, name: true, species: true } } },
  });
  if (!appointment)
    throw new AppError(
      404,
      "APPOINTMENT_NOT_FOUND",
      "Appointment was not found.",
    );
  return appointment;
}

export async function createAppointment(
  ownerId: string,
  input: AppointmentInput,
) {
  await getOwnedPet(ownerId, input.petId);
  return prisma.appointment.create({
    data: {
      petId: input.petId,
      appointmentDate: parseTimestamp(input.appointmentDate),
      providerName: input.providerName,
      reason: input.reason,
      notes: input.notes,
      status: "SCHEDULED",
    },
    include: { pet: { select: { id: true, name: true, species: true } } },
  });
}

export async function updateAppointment(
  ownerId: string,
  id: string,
  input: Partial<AppointmentInput>,
) {
  await getOwnedAppointment(ownerId, id);
  if (input.petId) await getOwnedPet(ownerId, input.petId);
  return prisma.appointment.update({
    where: { id },
    data: toData(input),
    include: { pet: { select: { id: true, name: true, species: true } } },
  });
}

export async function cancelAppointment(ownerId: string, id: string) {
  await getOwnedAppointment(ownerId, id);
  return prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { pet: { select: { id: true, name: true, species: true } } },
  });
}
