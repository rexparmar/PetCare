import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { formatInZone } from "../utils/time.js";
import {
  appointmentReminderDue,
  dueMedicationDoses,
} from "./reminder-rules.js";

export type PreferencesInput = {
  timeZone?: string;
  medicationReminders?: boolean;
  appointmentReminders?: boolean;
  appointmentLeadHours?: number;
};

const RETENTION_DAYS = 30;

const notificationSelect = {
  id: true,
  petId: true,
  type: true,
  title: true,
  message: true,
  dueAt: true,
  readAt: true,
  createdAt: true,
  pet: { select: { id: true, name: true } },
} satisfies Prisma.NotificationSelect;

export async function notifyUser(
  notification: Prisma.NotificationCreateManyInput,
) {
  const result = await prisma.notification.createMany({
    data: [notification],
    skipDuplicates: true,
  });
  return result.count;
}

type Preference = {
  userId: string;
  timeZone: string;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  appointmentLeadHours: number;
};

async function generateForPreference(preference: Preference, now: Date) {
  const { userId, timeZone } = preference;
  const drafts: Prisma.NotificationCreateManyInput[] = [];

  if (preference.medicationReminders) {
    const medications = await prisma.medication.findMany({
      where: { isActive: true, pet: { ownerId: userId } },
      include: { pet: { select: { id: true, name: true } } },
    });
    for (const medication of medications) {
      for (const dose of dueMedicationDoses(medication, now, timeZone)) {
        const extra = medication.instructions
          ? ` ${medication.instructions}`
          : "";
        drafts.push({
          userId,
          petId: medication.pet.id,
          type: "MEDICATION",
          title: `${medication.pet.name}: time for ${medication.name}`.slice(
            0,
            160,
          ),
          message: `Give ${medication.dosage} (${dose.time}).${extra}`.slice(
            0,
            500,
          ),
          dueAt: dose.dueAt,
          dedupeKey: `med:${medication.id}:${dose.date}:${dose.time}`,
        });
      }
    }
  }

  if (preference.appointmentReminders) {
    const horizon = new Date(
      now.getTime() + preference.appointmentLeadHours * 3_600_000,
    );
    const appointments = await prisma.appointment.findMany({
      where: {
        status: "SCHEDULED",
        appointmentDate: { gt: now, lte: horizon },
        pet: { ownerId: userId },
      },
      include: { pet: { select: { id: true, name: true } } },
    });
    for (const appointment of appointments) {
      if (
        !appointmentReminderDue(
          appointment.appointmentDate,
          now,
          preference.appointmentLeadHours,
        )
      )
        continue;
      drafts.push({
        userId,
        petId: appointment.pet.id,
        type: "APPOINTMENT",
        title: `${appointment.pet.name}: appointment coming up`.slice(0, 160),
        message:
          `${appointment.reason} with ${appointment.providerName} on ${formatInZone(appointment.appointmentDate, timeZone)}.`.slice(
            0,
            500,
          ),
        dueAt: now,
        dedupeKey: `appt:${appointment.id}:${appointment.appointmentDate.getTime()}`,
      });
    }
  }

  if (!drafts.length) return 0;
  const result = await prisma.notification.createMany({
    data: drafts,
    skipDuplicates: true,
  });
  return result.count;
}

// Creates any reminders that are due right now. Each reminder has a unique key,
// so running this repeatedly (every minute, or on every page poll) never
// produces the same reminder twice. Users who have not yet reported a time
// zone are skipped so reminders are never generated at the wrong hour.
export async function generateReminders(now = new Date(), userId?: string) {
  const preferences = await prisma.notificationPreference.findMany({
    where: userId ? { userId } : {},
  });
  let created = 0;
  for (const preference of preferences)
    created += await generateForPreference(preference, now);
  return created;
}

export async function pruneOldNotifications(now = new Date()) {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86_400_000);
  const result = await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function listNotifications(userId: string, now = new Date()) {
  await generateReminders(now, userId);
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      select: notificationSelect,
      orderBy: [{ dueAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unreadCount };
}

export async function markRead(userId: string, id: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing)
    throw new AppError(
      404,
      "NOTIFICATION_NOT_FOUND",
      "Notification was not found.",
    );
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return prisma.notification.findUniqueOrThrow({
    where: { id },
    select: notificationSelect,
  });
}

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function getPreferences(userId: string) {
  const preference = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  return {
    timeZone: preference?.timeZone ?? null,
    medicationReminders: preference?.medicationReminders ?? true,
    appointmentReminders: preference?.appointmentReminders ?? true,
    appointmentLeadHours: preference?.appointmentLeadHours ?? 24,
  };
}

export async function updatePreferences(
  userId: string,
  input: PreferencesInput,
) {
  await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...input, timeZone: input.timeZone ?? "UTC" },
    update: input,
  });
  return getPreferences(userId);
}
