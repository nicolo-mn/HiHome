import { describe, it, expect, beforeEach } from "vitest";
import { UsageService } from "./UsageService";
import { Home } from "../../domain/Home";
import { Room } from "../../domain/Room";
import { Light, Window, Thermostat, DeviceTypes } from "../../domain/Device";
import { DeviceEvent } from "../../domain/EventLog";
import { HomeRepository } from "../../domain/HomeRepository";
import { LIGHT_WATTAGE_W } from "./UsageService";
import type { HistoricalWeatherRepository } from "../HistoricalWeatherRepository";

class FakeHomeRepository implements HomeRepository {
  constructor(public home: Home) {}
  async getHome(id: string) {
    return this.home.id === id ? this.home : null;
  }
  async getAllHomes() {
    return [this.home];
  }
  async getDeviceById() {
    return null;
  }
  async saveHome() {}
}

class FakeHistoricalWeatherRepository implements HistoricalWeatherRepository {
  constructor(private data: any = null) {}

  getByHomeId() {
    return this.data;
  }

  setForHome(homeId: string, data: any) {
    this.data = data;
  }
}

const NOW = new Date("2026-05-22T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000);
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 24 * 3600_000);

function buildHome(events: DeviceEvent[]): Home {
  return new Home(
    "1",
    { latitude: 0, longitude: 0 },
    [
      new Room("room-1", "Living", [
        new Light("light-1", "L1", "room-1"),
        new Light("light-2", "L2", "room-1"),
        new Window("window-1", "W1", "room-1"),
        new Thermostat("therm-1", "T1", "room-1"),
      ]),
    ],
    new Array(24).fill(20),
    events,
  );
}

function makeService(events: DeviceEvent[]): UsageService {
  return new UsageService(
    new FakeHomeRepository(buildHome(events)),
    new FakeHistoricalWeatherRepository(),
  );
}

function ev(
  eventType: DeviceEvent["eventType"],
  deviceId: string,
  createdAt: Date,
  extras: Partial<DeviceEvent> = {},
): DeviceEvent {
  const deviceType =
    eventType === "LightTurnedOn" || eventType === "LightTurnedOff"
      ? DeviceTypes.LIGHT
      : eventType === "WindowOpened" || eventType === "WindowClosed"
        ? DeviceTypes.WINDOW
        : DeviceTypes.THERMOSTAT;
  return {
    id: `${eventType}-${createdAt.getTime()}`,
    deviceId,
    deviceType: deviceType,
    eventType,
    createdAt,
    ...extras,
  } as DeviceEvent;
}

describe("UsageService", () => {
  describe("empty event log", () => {
    it("returns zeroed report", async () => {
      const svc = makeService([]);
      const report = await svc.getUsage("1", 7, NOW);

      expect(report).toEqual({
        rangeDays: 7,
        energyKWhPerWeek: 0,
        lightsOnHoursPerWeek: 0,
        windowOpenHours: 0,
        manualVsAutomated: { manual: 0, automated: 0 },
        activityByHour: new Array(24).fill(0),
        historicalWeather: null,
      });
    });
  });

  describe("light on/off intervals", () => {
    it("sums paired on/off intervals", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", hoursAgo(10)),
        ev("LightTurnedOff", "light-1", hoursAgo(8)),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      expect(r.lightsOnHoursPerWeek).toBeCloseTo(2);
      expect(r.energyKWhPerWeek).toBeCloseTo((2 * LIGHT_WATTAGE_W) / 1000);
    });

    it("closes dangling on at range end (now)", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", hoursAgo(3)),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      expect(r.lightsOnHoursPerWeek).toBeCloseTo(3);
    });

    it("ignores off-without-prior-on (orphan off event)", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOff", "light-1", hoursAgo(4)),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      expect(r.lightsOnHoursPerWeek).toBe(0);
    });

    it("carries over an 'on' that began before the range", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", daysAgo(10)),
        ev("LightTurnedOff", "light-1", hoursAgo(2)),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      const expectedHours = 7 * 24 - 2;
      expect(r.lightsOnHoursPerWeek).toBeCloseTo(expectedHours);
    });

    it("unions overlapping light intervals (two lights on for 30min = 30min, not 1h)", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", hoursAgo(2)),
        ev("LightTurnedOn", "light-2", hoursAgo(2)),
        ev("LightTurnedOff", "light-1", hoursAgo(1)),
        ev("LightTurnedOff", "light-2", hoursAgo(1)),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      expect(r.lightsOnHoursPerWeek).toBeCloseTo(1);
      expect(r.energyKWhPerWeek).toBeCloseTo((2 * LIGHT_WATTAGE_W) / 1000);
    });

    it("merges partially overlapping light intervals", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", hoursAgo(4)),
        ev("LightTurnedOn", "light-2", hoursAgo(3)),
        ev("LightTurnedOff", "light-1", hoursAgo(2)),
        ev("LightTurnedOff", "light-2", hoursAgo(1)),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      expect(r.lightsOnHoursPerWeek).toBeCloseTo(3);
    });
  });

  describe("window open time", () => {
    it("sums window open intervals", async () => {
      const events: DeviceEvent[] = [
        ev("WindowOpened", "window-1", hoursAgo(6)),
        ev("WindowClosed", "window-1", hoursAgo(5)),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      expect(r.windowOpenHours).toBeCloseTo(1);
    });
  });

  describe("manual vs automated", () => {
    it("counts events by presence of actor", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", hoursAgo(2), {
          actor: { username: "alice", role: "User" },
        } as any),
        ev("LightTurnedOff", "light-1", hoursAgo(1)),
        ev("LightTurnedOn", "light-2", hoursAgo(3), {
          actor: { username: "bob", role: "Admin" },
        } as any),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      expect(r.manualVsAutomated).toEqual({ manual: 2, automated: 1 });
    });
  });

  describe("activity by hour", () => {
    it("buckets events by hour-of-day", async () => {
      const at = (iso: string) => new Date(iso);
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", at("2026-05-22T05:30:00Z")),
        ev("LightTurnedOff", "light-1", at("2026-05-22T05:45:00Z")),
        ev("LightTurnedOn", "light-1", at("2026-05-21T22:10:00Z")),
      ];
      const svc = makeService(events);
      const r = await svc.getUsage("1", 7, NOW);
      const totalBuckets = r.activityByHour.reduce((a, b) => a + b, 0);
      expect(totalBuckets).toBe(3);
      expect(r.activityByHour.length).toBe(24);
    });
  });

  describe("range filtering", () => {
    it("excludes events older than the range", async () => {
      const events: DeviceEvent[] = [
        ev("LightTurnedOn", "light-1", daysAgo(20)),
        ev("LightTurnedOff", "light-1", daysAgo(19)),
      ];
      const svc = makeService(events);
      const r7 = await svc.getUsage("1", 7, NOW);
      expect(r7.lightsOnHoursPerWeek).toBe(0);

      const r30 = await svc.getUsage("1", 30, NOW);
      expect(r30.lightsOnHoursPerWeek).toBeGreaterThan(0);
    });
  });

  describe("not found", () => {
    it("throws when home does not exist", async () => {
      const svc = makeService([]);
      await expect(svc.getUsage("does-not-exist", 7, NOW)).rejects.toThrow();
    });
  });
});
