import { describe, it, expect } from "vitest";
import { DeviceEvent } from "../../domain";
import { OnOffIntervalCalculator } from "./OnOffIntervalCalculator";

const ON = "LightTurnedOn";
const OFF = "LightTurnedOff";
const calc = new OnOffIntervalCalculator({ onType: ON, offType: OFF });

const start = new Date("2026-01-01T00:00:00.000Z");
const end = new Date("2026-01-02T00:00:00.000Z"); // 24h window
const at = (hours: number): Date =>
  new Date(start.getTime() + hours * 60 * 60 * 1000);

const ev = (
  eventType: string,
  deviceId: string,
  createdAt: Date,
): DeviceEvent =>
  ({ eventType, deviceId, createdAt }) as unknown as DeviceEvent;

describe("OnOffIntervalCalculator.totalOnHours", () => {
  it("measures a single on/off interval inside the range", () => {
    const log = [ev(ON, "d1", at(1)), ev(OFF, "d1", at(3))];
    expect(calc.totalOnHours(log, start, end)).toBeCloseTo(2);
  });

  it("sums overlapping intervals from different devices (counted twice)", () => {
    const log = [
      ev(ON, "d1", at(0)),
      ev(OFF, "d1", at(2)),
      ev(ON, "d2", at(0)),
      ev(OFF, "d2", at(2)),
    ];
    expect(calc.totalOnHours(log, start, end)).toBeCloseTo(4);
  });

  it("counts an 'on' with no matching 'off' up to the range end", () => {
    const log = [ev(ON, "d1", at(20))];
    expect(calc.totalOnHours(log, start, end)).toBeCloseTo(4);
  });

  it("carries over an 'on' that began before the range start", () => {
    const log = [ev(ON, "d1", at(-1)), ev(OFF, "d1", at(2))];
    expect(calc.totalOnHours(log, start, end)).toBeCloseTo(2);
  });

  it("ignores events entirely outside the range", () => {
    const log = [ev(ON, "d1", at(30)), ev(OFF, "d1", at(32))];
    expect(calc.totalOnHours(log, start, end)).toBe(0);
  });

  it("ignores event types that are not in the configured pair", () => {
    const log = [
      ev("WindowOpened", "w1", at(1)),
      ev("WindowClosed", "w1", at(3)),
    ];
    expect(calc.totalOnHours(log, start, end)).toBe(0);
  });

  it("holds the cursor when a second 'on' arrives before an 'off'", () => {
    const log = [
      ev(ON, "d1", at(0)),
      ev(ON, "d1", at(1)),
      ev(OFF, "d1", at(2)),
    ];
    expect(calc.totalOnHours(log, start, end)).toBeCloseTo(2);
  });

  it("ignores an 'off' with no preceding 'on' inside the range", () => {
    const log = [ev(OFF, "d1", at(1))];
    expect(calc.totalOnHours(log, start, end)).toBe(0);
  });

  it("returns 0 for an empty log", () => {
    expect(calc.totalOnHours([], start, end)).toBe(0);
  });
});

describe("OnOffIntervalCalculator.unionOnHours", () => {
  it("merges overlapping intervals across devices into one", () => {
    const log = [
      ev(ON, "d1", at(0)),
      ev(OFF, "d1", at(2)),
      ev(ON, "d2", at(1)),
      ev(OFF, "d2", at(3)),
    ];
    expect(calc.unionOnHours(log, start, end)).toBeCloseTo(3);
  });

  it("merges touching intervals (start === previous end)", () => {
    const log = [
      ev(ON, "d1", at(0)),
      ev(OFF, "d1", at(1)),
      ev(ON, "d2", at(1)),
      ev(OFF, "d2", at(2)),
    ];
    expect(calc.unionOnHours(log, start, end)).toBeCloseTo(2);
  });

  it("sums disjoint intervals", () => {
    const log = [
      ev(ON, "d1", at(0)),
      ev(OFF, "d1", at(1)),
      ev(ON, "d2", at(2)),
      ev(OFF, "d2", at(3)),
    ];
    expect(calc.unionOnHours(log, start, end)).toBeCloseTo(2);
  });

  it("returns 0 for an empty log", () => {
    expect(calc.unionOnHours([], start, end)).toBe(0);
  });

  it("returns 0 when only 'off' events are present", () => {
    const log = [ev(OFF, "d1", at(1)), ev(OFF, "d2", at(2))];
    expect(calc.unionOnHours(log, start, end)).toBe(0);
  });
});
