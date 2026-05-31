// A time-window gate for a rule: the rule may only act when "now" falls inside
// the window. All evaluation is done in Rome local time.
const RULE_TIMEZONE = "Europe/Rome";

// 0 = Sunday ... 6 = Saturday, matching Date.getDay() / Intl weekday order.
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type TimeWindowSpec = {
  days?: number[]; // subset of 0..6; absent/empty => every day
  start?: string; // "HH:MM"; absent => start of day
  end?: string; // "HH:MM"; absent => end of day
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const romeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: RULE_TIMEZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function romeParts(now: Date): { day: number; minutes: number } {
  const parts = romeFormatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = WEEKDAY_INDEX[get("weekday")];
  // "24" can appear for midnight under hour12:false; normalize to 0.
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { day, minutes: hour * 60 + minute };
}

export class TimeWindow {
  constructor(private readonly spec: TimeWindowSpec) {}

  get value(): TimeWindowSpec {
    return this.spec;
  }

  contains(now: Date): boolean {
    const { day, minutes } = romeParts(now);

    if (this.spec.days?.length && !this.spec.days.includes(day)) {
      return false;
    }

    const start = this.spec.start ? toMinutes(this.spec.start) : 0;
    const end = this.spec.end ? toMinutes(this.spec.end) : 24 * 60 - 1;

    if (start <= end) {
      return minutes >= start && minutes <= end;
    }
    // Wrap past midnight (e.g. 22:00 -> 06:00).
    return minutes >= start || minutes <= end;
  }
}
