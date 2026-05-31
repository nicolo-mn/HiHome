import type { TimeWindowDto } from "@/api/rules";

// 0 = Sunday ... 6 = Saturday, matching the backend TimeWindow encoding.
export const DAY_LABELS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];
export const DAY_LABELS_LETTER = ["S", "M", "T", "W", "T", "F", "S"];

// Display order for a week that starts on Monday and ends on Sunday. Values are
// still backend day numbers (0 = Sunday); only the presentation order changes.
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

// Turns free typing into an "HH:MM" mask: keeps up to 4 digits and inserts the
// colon once a third digit is entered (so backspacing never traps the colon).
export function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function sameDays(a: number[], b: number[]): boolean {
  const set = new Set(a);
  return a.length === b.length && b.every((d) => set.has(d));
}

export function formatDays(days?: number[]): string {
  if (!days || days.length === 0 || days.length === 7) return "Every day";
  if (sameDays(days, WEEKDAYS)) return "Weekdays";
  if (sameDays(days, WEEKEND)) return "Weekends";
  const selected = new Set(days);
  return DAY_ORDER.filter((d) => selected.has(d))
    .map((d) => DAY_LABELS_SHORT[d])
    .join(", ");
}

export function isOvernight(start?: string, end?: string): boolean {
  return Boolean(start && end && end < start);
}

export function formatTimeRange(start?: string, end?: string): string {
  if (start && end) return `${start}–${end}`;
  if (start) return `from ${start}`;
  if (end) return `until ${end}`;
  return "all day";
}

export function formatTimeWindow(tw: TimeWindowDto): string {
  const range = formatTimeRange(tw.start, tw.end);
  const overnight = isOvernight(tw.start, tw.end) ? " (overnight)" : "";
  return `${formatDays(tw.days)} · ${range}${overnight}`;
}
