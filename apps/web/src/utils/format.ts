export function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";
  const dateOnly = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function localDateInputValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function petEmoji(species: string) {
  const normalized = species.toLowerCase();
  if (normalized.includes("cat")) return "🐱";
  if (normalized.includes("bird")) return "🐦";
  if (normalized.includes("rabbit")) return "🐰";
  if (normalized.includes("fish")) return "🐠";
  return "🐶";
}
