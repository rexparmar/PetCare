import type { ClinicRequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { clinicGateway } from "./clinic-gateway.js";
import { notifyUser } from "./notification.service.js";
import { getOwnedPet } from "./pet.service.js";

export function listClinics() {
  return clinicGateway.listClinics();
}

async function describeLink(
  link: {
    clinicId: string;
    linkedAt: Date;
    lastSharedAt: Date | null;
    lastSharedCount: number;
  } | null,
) {
  if (!link) return null;
  return {
    clinic: await clinicGateway.getClinic(link.clinicId),
    linkedAt: link.linkedAt,
    lastSharedAt: link.lastSharedAt,
    lastSharedCount: link.lastSharedCount,
  };
}

async function requireLink(petId: string) {
  const link = await prisma.clinicLink.findUnique({ where: { petId } });
  if (!link)
    throw new AppError(
      409,
      "NO_CLINIC_LINKED",
      "Link this pet to a clinic first.",
    );
  return link;
}

export async function getPetClinic(ownerId: string, petId: string) {
  await getOwnedPet(ownerId, petId);
  return describeLink(await prisma.clinicLink.findUnique({ where: { petId } }));
}

export async function linkClinic(
  ownerId: string,
  petId: string,
  clinicId: string,
) {
  await getOwnedPet(ownerId, petId);
  const clinic = await clinicGateway.getClinic(clinicId);
  if (!clinic)
    throw new AppError(404, "CLINIC_NOT_FOUND", "Clinic was not found.");
  const link = await prisma.clinicLink.upsert({
    where: { petId },
    create: { petId, clinicId },
    update: {
      clinicId,
      linkedAt: new Date(),
      lastSharedAt: null,
      lastSharedCount: 0,
    },
  });
  return describeLink(link);
}

export async function unlinkClinic(ownerId: string, petId: string) {
  await getOwnedPet(ownerId, petId);
  await prisma.clinicLink.deleteMany({ where: { petId } });
}

export async function shareRecords(ownerId: string, petId: string) {
  const pet = await getOwnedPet(ownerId, petId);
  const link = await requireLink(petId);
  const records = await prisma.healthRecord.findMany({
    where: { petId },
    orderBy: { recordDate: "asc" },
  });
  if (!records.length)
    throw new AppError(
      409,
      "NO_RECORDS",
      "Add a health record before sharing records with a clinic.",
    );
  const receipt = await clinicGateway.receiveRecords(link.clinicId, {
    petName: pet.name,
    species: pet.species,
    breed: pet.breed,
    records: records.map((record) => ({
      type: record.recordType,
      title: record.title,
      date: record.recordDate.toISOString().slice(0, 10),
      veterinarian: record.veterinarianName,
      description: record.description,
    })),
  });
  await prisma.clinicLink.update({
    where: { petId },
    data: {
      lastSharedAt: receipt.receivedAt,
      lastSharedCount: receipt.receivedCount,
    },
  });
  return {
    receiptId: receipt.receiptId,
    sharedCount: receipt.receivedCount,
    sharedAt: receipt.receivedAt,
  };
}

const requestSelect = {
  id: true,
  appointmentId: true,
  clinicId: true,
  externalReference: true,
  status: true,
  message: true,
  submittedAt: true,
  updatedAt: true,
} as const;

async function announce(
  ownerId: string,
  petId: string,
  petName: string,
  request: { id: string; status: ClinicRequestStatus; message: string | null },
  submittedAt: Date,
) {
  if (request.status === "PENDING") return;
  const confirmed = request.status === "CONFIRMED";
  await notifyUser({
    userId: ownerId,
    petId,
    type: "CLINIC",
    title: `${petName}: clinic ${confirmed ? "confirmed" : "declined"} the appointment request`,
    message: request.message ?? "",
    dueAt: new Date(),
    dedupeKey: `clinic:${request.id}:${submittedAt.getTime()}:${request.status}`,
  });
}

export async function submitAppointment(
  ownerId: string,
  petId: string,
  appointmentId: string,
) {
  const pet = await getOwnedPet(ownerId, petId);
  const link = await requireLink(petId);
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, petId },
  });
  if (!appointment)
    throw new AppError(
      404,
      "APPOINTMENT_NOT_FOUND",
      "Appointment was not found.",
    );
  if (appointment.status !== "SCHEDULED")
    throw new AppError(
      409,
      "APPOINTMENT_NOT_SCHEDULED",
      "Only scheduled appointments can be sent to a clinic.",
    );
  if (appointment.appointmentDate <= new Date())
    throw new AppError(
      409,
      "APPOINTMENT_IN_PAST",
      "This appointment is in the past.",
    );
  const owner = await prisma.user.findUniqueOrThrow({
    where: { id: ownerId },
    select: { fullName: true },
  });
  const result = await clinicGateway.submitAppointment(link.clinicId, {
    petName: pet.name,
    species: pet.species,
    reason: appointment.reason,
    scheduledAt: appointment.appointmentDate,
    ownerName: owner.fullName,
  });
  const submittedAt = new Date();
  const saved = await prisma.clinicAppointmentRequest.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      clinicId: link.clinicId,
      externalReference: result.externalReference,
      status: result.status,
      message: result.message,
      submittedAt,
    },
    update: {
      clinicId: link.clinicId,
      externalReference: result.externalReference,
      status: result.status,
      message: result.message,
      submittedAt,
    },
    select: requestSelect,
  });
  await announce(ownerId, petId, pet.name, saved, submittedAt);
  return saved;
}

export async function listRequests(ownerId: string, petId: string) {
  const pet = await getOwnedPet(ownerId, petId);
  const requests = await prisma.clinicAppointmentRequest.findMany({
    where: { appointment: { petId } },
    select: {
      ...requestSelect,
      appointment: { select: { appointmentDate: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
  const results = [];
  for (const { appointment, ...request } of requests) {
    let current = request;
    if (request.status === "PENDING") {
      const checked = await clinicGateway.checkRequest(
        request.clinicId,
        request.externalReference,
        {
          submittedAt: request.submittedAt,
          scheduledAt: appointment.appointmentDate,
        },
      );
      if (checked.status !== request.status) {
        current = await prisma.clinicAppointmentRequest.update({
          where: { id: request.id },
          data: { status: checked.status, message: checked.message },
          select: requestSelect,
        });
        await announce(ownerId, petId, pet.name, current, request.submittedAt);
      }
    }
    results.push(current);
  }
  return results;
}
