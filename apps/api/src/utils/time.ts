export function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// The wall-clock date (YYYY-MM-DD) and minutes since midnight in a time zone.
export function localClock(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

// ISO weekday in a time zone: 1 = Monday ... 7 = Sunday.
export function localWeekday(now: Date, timeZone: string) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(now);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(name) + 1;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
