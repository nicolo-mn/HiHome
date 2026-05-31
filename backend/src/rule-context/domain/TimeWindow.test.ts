import { describe, it, expect } from "vitest";
import { TimeWindow } from "./TimeWindow";

// All instants below are UTC; comments give the Europe/Rome local equivalent.
// CET (winter) = UTC+1, CEST (summer) = UTC+2.
const THU_2200 = new Date("2026-01-15T21:00:00Z"); // Rome Thu 22:00
const THU_1200 = new Date("2026-01-15T11:00:00Z"); // Rome Thu 12:00
const FRI_0030 = new Date("2026-01-15T23:30:00Z"); // Rome Fri 00:30 (next day in Rome)
const FRI_0200 = new Date("2026-01-16T01:00:00Z"); // Rome Fri 02:00
const WED_2230_DST = new Date("2026-07-15T20:30:00Z"); // Rome Wed 22:30 (CEST)

describe("TimeWindow", () => {
  it("is always active when the spec is empty", () => {
    const window = new TimeWindow({});
    expect(window.contains(THU_1200)).toBe(true);
    expect(window.contains(THU_2200)).toBe(true);
  });

  it("matches a daily time range within the same day", () => {
    const window = new TimeWindow({ start: "09:00", end: "17:00" });
    expect(window.contains(THU_1200)).toBe(true);
    expect(window.contains(THU_2200)).toBe(false);
  });

  it("wraps a time range past midnight", () => {
    const window = new TimeWindow({ start: "22:00", end: "06:00" });
    expect(window.contains(THU_2200)).toBe(true); // 22:00 -> inside
    expect(window.contains(FRI_0200)).toBe(true); // 02:00 -> inside
    expect(window.contains(THU_1200)).toBe(false); // 12:00 -> outside
  });

  it("filters by Rome day-of-week", () => {
    const thursdayOnly = new TimeWindow({ days: [4] });
    expect(thursdayOnly.contains(THU_1200)).toBe(true);
    expect(thursdayOnly.contains(FRI_0200)).toBe(false);
  });

  it("uses the Rome day, not the UTC day, near midnight", () => {
    // FRI_0030 is still Thursday in UTC but already Friday in Rome.
    const fridayOnly = new TimeWindow({ days: [5] });
    expect(fridayOnly.contains(FRI_0030)).toBe(true);
    const thursdayOnly = new TimeWindow({ days: [4] });
    expect(thursdayOnly.contains(FRI_0030)).toBe(false);
  });

  it("combines day-of-week and time range", () => {
    const window = new TimeWindow({ days: [4], start: "22:00", end: "06:00" });
    expect(window.contains(THU_2200)).toBe(true); // Thursday, in band
    expect(window.contains(THU_1200)).toBe(false); // Thursday, out of band
    expect(window.contains(FRI_0200)).toBe(false); // in band but Friday
  });

  it("evaluates correctly under summer DST (CEST)", () => {
    const window = new TimeWindow({ days: [3], start: "22:00", end: "23:00" });
    expect(window.contains(WED_2230_DST)).toBe(true); // Rome Wed 22:30
  });
});
