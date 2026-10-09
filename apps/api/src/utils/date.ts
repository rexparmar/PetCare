import { AppError } from "./app-error.js";

export function parseDateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "A date must use the YYYY-MM-DD format.",
    );
  }
  return date;
}

export function parseTimestamp(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Appointment date must be a valid ISO timestamp.",
    );
  }
  return date;
}
