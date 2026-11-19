import { localClock, timeToMinutes } from "../utils/time.js";

export type ScheduledMedication = {
  timesOfDay: string[];
  startDate: Date;
  endDate: Date | null;
};

export type DueDose = { time: string; date: string; dueAt: Date };

// A dose is "due" from its scheduled time until the grace period ends. The
// window keeps a restart or a short outage from losing a reminder without
// flooding the owner with doses from hours ago.
export const DOSE_GRACE_MINUTES = 60;

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);

export function dueMedicationDoses(
  medication: ScheduledMedication,
  now: Date,
  timeZone: string,
  graceMinutes = DOSE_GRACE_MINUTES,
): DueDose[] {
  const clock = localClock(now, timeZone);
  if (dateOnly(medication.startDate) > clock.date) return [];
  if (medication.endDate && dateOnly(medication.endDate) < clock.date)
    return [];
  const minuteStart = Math.floor(now.getTime() / 60_000) * 60_000;
  return medication.timesOfDay.flatMap((time) => {
    const late = clock.minutes - timeToMinutes(time);
    if (late < 0 || late > graceMinutes) return [];
    return [
      { time, date: clock.date, dueAt: new Date(minuteStart - late * 60_000) },
    ];
  });
}

export function appointmentReminderDue(
  appointmentDate: Date,
  now: Date,
  leadHours: number,
) {
  const until = appointmentDate.getTime() - now.getTime();
  return until > 0 && until <= leadHours * 3_600_000;
}
