import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DeviceEventActor,
  Fan,
  Home,
  Light,
  Room,
  SmartLock,
  Thermostat,
  Window,
} from "../../domain";
import { InMemoryHomeRepository } from "../../infrastructure/repositories/InMemoryHomeRepository";
import { ActionService } from "./ActionService";

const buildHome = (): Home =>
  new Home("1", { latitude: 0, longitude: 0 }, [
    new Room("room-1", "Living Room", [
      new Light("light-1", "Main Light", "room-1"),
      new Window("window-1", "Bay Window", "room-1"),
      new Thermostat("therm-1", "Hall", "room-1"),
      new SmartLock("lock-1", "Front Door", "room-1"),
      new Fan("fan-1", "Tower Fan", "room-1"),
    ]),
  ]);

describe("ActionService", () => {
  let repo: InMemoryHomeRepository;
  let home: Home;
  let deviceUpdatePort: { sendDeviceUpdate: ReturnType<typeof vi.fn> };
  let service: ActionService;

  beforeEach(async () => {
    repo = new InMemoryHomeRepository();
    home = buildHome();
    await repo.saveHome(home);
    deviceUpdatePort = { sendDeviceUpdate: vi.fn() };
    service = new ActionService(repo, deviceUpdatePort);
  });

  it("lightTurnOn turns the light on, logs the event, persists and broadcasts", async () => {
    const saveSpy = vi.spyOn(repo, "saveHome");

    await service.lightTurnOn("1", "light-1");

    const light = home.getDeviceById("light-1") as Light;
    expect(light.isOn).toBe(true);
    expect(home.eventLog.at(-1)?.eventType).toBe("LightTurnedOn");
    expect(saveSpy).toHaveBeenCalledWith(home);
    expect(deviceUpdatePort.sendDeviceUpdate).toHaveBeenCalledWith(home, light);
  });

  it("lightTurnOff turns the light off and logs the event", async () => {
    (home.getDeviceById("light-1") as Light).isOn = true;

    await service.lightTurnOff("1", "light-1");

    expect((home.getDeviceById("light-1") as Light).isOn).toBe(false);
    expect(home.eventLog.at(-1)?.eventType).toBe("LightTurnedOff");
  });

  it("windowOpen / windowClose flip the window and log events", async () => {
    await service.windowOpen("1", "window-1");
    expect((home.getDeviceById("window-1") as Window).isOpen).toBe(true);
    expect(home.eventLog.at(-1)?.eventType).toBe("WindowOpened");

    await service.windowClose("1", "window-1");
    expect((home.getDeviceById("window-1") as Window).isOpen).toBe(false);
    expect(home.eventLog.at(-1)?.eventType).toBe("WindowClosed");
  });

  it("lockLock / lockUnlock flip the lock and log events", async () => {
    await service.lockUnlock("1", "lock-1");
    expect((home.getDeviceById("lock-1") as SmartLock).isLocked).toBe(false);
    expect(home.eventLog.at(-1)?.eventType).toBe("LockUnlocked");

    await service.lockLock("1", "lock-1");
    expect((home.getDeviceById("lock-1") as SmartLock).isLocked).toBe(true);
    expect(home.eventLog.at(-1)?.eventType).toBe("LockLocked");
  });

  it("lockUnlock forwards the actor into the logged event", async () => {
    const actor: DeviceEventActor = { username: "bob", role: "standard" };

    await service.lockUnlock("1", "lock-1", actor);

    expect(home.eventLog.at(-1)?.actor).toEqual(actor);
  });

  it("fanSetMode sets the mode and logs the event", async () => {
    await service.fanSetMode("1", "fan-1", "high");

    expect((home.getDeviceById("fan-1") as Fan).mode).toBe("high");
    expect(home.eventLog.at(-1)?.eventType).toBe("FanModeSet");
  });

  describe("thermostatSetTemperature", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T08:30:00")); // local hour 8
    });
    afterEach(() => vi.useRealTimers());

    it("sets the temperature, logs the event and records the hourly plan", async () => {
      await service.thermostatSetTemperature("1", "therm-1", 23);

      expect((home.getDeviceById("therm-1") as Thermostat).temperature).toBe(
        23,
      );
      expect(home.eventLog.at(-1)?.eventType).toBe("ThermostatSet");
      expect(home.hourlyTemperatures[8]).toBe(23);
    });

    it("initializes the hourly plan array when it is missing", async () => {
      home.hourlyTemperatures = undefined as unknown as number[];

      await service.thermostatSetTemperature("1", "therm-1", 19);

      expect(home.hourlyTemperatures).toHaveLength(24);
      expect(home.hourlyTemperatures[8]).toBe(19);
    });
  });

  describe("error cases", () => {
    it("throws when the device id is unknown", async () => {
      await expect(service.lightTurnOn("1", "nope")).rejects.toThrow(
        "Device nope of type light not found",
      );
    });

    it("throws when the id exists but is the wrong device type", async () => {
      await expect(service.lightTurnOn("1", "window-1")).rejects.toThrow(
        "Device window-1 of type light not found",
      );
    });

    it("throws when the home does not exist", async () => {
      await expect(service.lightTurnOn("999", "light-1")).rejects.toThrow(
        "Home 999 not found",
      );
    });
  });
});
