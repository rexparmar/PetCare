import { prisma } from "../lib/prisma.js";

export async function getDashboard(ownerId: string) {
  const now = new Date();
  const [petCount, pets, upcomingAppointments, recentHealthRecords] =
    await Promise.all([
      prisma.pet.count({ where: { ownerId } }),
      prisma.pet.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          _count: { select: { healthRecords: true, appointments: true } },
        },
      }),
      prisma.appointment.findMany({
        where: {
          pet: { ownerId },
          status: "SCHEDULED",
          appointmentDate: { gte: now },
        },
        orderBy: { appointmentDate: "asc" },
        take: 5,
        include: { pet: { select: { id: true, name: true, species: true } } },
      }),
      prisma.healthRecord.findMany({
        where: { pet: { ownerId } },
        orderBy: { recordDate: "desc" },
        take: 5,
        include: { pet: { select: { id: true, name: true, species: true } } },
      }),
    ]);

  return { petCount, pets, upcomingAppointments, recentHealthRecords };
}
