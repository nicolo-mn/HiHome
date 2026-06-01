import { describe, it, expect, vi } from "vitest";
import {
  createDevice,
  Device,
  DeviceTypes,
  Fan,
  Light,
  SmartLock,
  Thermostat,
  Window,
} from "./Device";
import { DeviceEventActor } from "./EventLog";

const actor: DeviceEventActor = { username: "alice", role: "admin" };

describe("createDevice", () => {
  it.each([
    [DeviceTypes.LIGHT, Light],
    [DeviceTypes.WINDOW, Window],
    [DeviceTypes.THERMOSTAT, Thermostat],
    [DeviceTypes.LOCK, SmartLock],
    [DeviceTypes.FAN, Fan],
  ])("creates a %s as the matching class with its type", (type, ctor) => {
    const device = createDevice("d1", { name: "Dev", type, roomId: "room-1" });
    expect(device).toBeInstanceOf(ctor);
    expect(device.id).toBe("d1");
    expect(device.name).toBe("Dev");
    expect(device.roomId).toBe("room-1");
    expect(device.getType()).toBe(type);
  });

  it("throws on an unsupported device type", () => {
    expect(() =>
      createDevice("d1", {
        name: "Dev",
        type: "toaster" as DeviceTypes,
        roomId: "room-1",
      }),
    ).toThrow("Unsupported device type");
  });
});

describe("Device default states", () => {
  it("uses the documented defaults", () => {
    expect(new Light("l", "L", "r").isOn).toBe(false);
    expect(new Window("w", "W", "r").isOpen).toBe(false);
    expect(new Thermostat("t", "T", "r").temperature).toBe(20);
    expect(new SmartLock("s", "S", "r").isLocked).toBe(true);
    expect(new Fan("f", "F", "r").mode).toBe("off");
  });
});

describe("Device mutators", () => {
  it("Light.turnOn / turnOff flips state and emits typed events", () => {
    const light = new Light("l1", "Main", "room-1");

    const onEvent = light.turnOn();
    expect(light.isOn).toBe(true);
    expect(onEvent.eventType).toBe("LightTurnedOn");
    expect(onEvent.deviceType).toBe(DeviceTypes.LIGHT);

    const offEvent = light.turnOff();
    expect(light.isOn).toBe(false);
    expect(offEvent.eventType).toBe("LightTurnedOff");
  });

  it("Window.open / close flips state and emits typed events", () => {
    const window = new Window("w1", "Kitchen", "room-1");

    expect(window.open().eventType).toBe("WindowOpened");
    expect(window.isOpen).toBe(true);
    expect(window.close().eventType).toBe("WindowClosed");
    expect(window.isOpen).toBe(false);
  });

  it("Thermostat.setTemperature stores the value and reports the target", () => {
    const thermostat = new Thermostat("t1", "Hall", "room-1");

    const event = thermostat.setTemperature(23);
    expect(thermostat.temperature).toBe(23);
    expect(event.eventType).toBe("ThermostatSet");
    expect(event.targetTemperature).toBe(23);
  });

  it("SmartLock.lock / unlock flips state and emits typed events", () => {
    const lock = new SmartLock("s1", "Front", "room-1");

    const unlocked = lock.unlock();
    expect(lock.isLocked).toBe(false);
    expect(unlocked.eventType).toBe("LockUnlocked");

    const locked = lock.lock();
    expect(lock.isLocked).toBe(true);
    expect(locked.eventType).toBe("LockLocked");
  });

  it("Fan.setMode stores the mode and reports it on the event", () => {
    const fan = new Fan("f1", "Tower", "room-1");

    const event = fan.setMode("high");
    expect(fan.mode).toBe("high");
    expect(event.eventType).toBe("FanModeSet");
    expect(event.mode).toBe("high");
  });

  it("stamps every event with device identity from buildEventBase", () => {
    const light = new Light("l1", "Main", "room-1");
    const event = light.turnOn();
    expect(event.deviceId).toBe("l1");
    expect(event.deviceName).toBe("Main");
    expect(event.deviceType).toBe(DeviceTypes.LIGHT);
    expect(event.createdAt).toBeInstanceOf(Date);
    expect(typeof event.id).toBe("string");
    expect(event.id.length).toBeGreaterThan(0);
  });

  it("generates a fresh unique id for each emitted event", () => {
    const light = new Light("l1", "Main", "room-1");
    expect(light.turnOn().id).not.toBe(light.turnOff().id);
  });
});

describe("Device mutator actor branch", () => {
  it("omits actor when none is provided", () => {
    expect(new Light("l1", "Main", "room-1").turnOn().actor).toBeUndefined();
  });

  it("attaches the actor when provided", () => {
    expect(new SmartLock("s1", "Front", "room-1").unlock(actor).actor).toEqual(
      actor,
    );
  });
});

describe("Device.accept", () => {
  const makeVisitor = () => ({
    visitLight: vi.fn().mockReturnValue("light"),
    visitWindow: vi.fn().mockReturnValue("window"),
    visitThermostat: vi.fn().mockReturnValue("thermostat"),
    visitLock: vi.fn().mockReturnValue("lock"),
    visitFan: vi.fn().mockReturnValue("fan"),
  });

  it.each([
    [new Light("l", "L", "r"), "visitLight", "light"],
    [new Window("w", "W", "r"), "visitWindow", "window"],
    [new Thermostat("t", "T", "r"), "visitThermostat", "thermostat"],
    [new SmartLock("s", "S", "r"), "visitLock", "lock"],
    [new Fan("f", "F", "r"), "visitFan", "fan"],
  ])("dispatches to the matching visitor method", (device, method, result) => {
    const visitor = makeVisitor();
    expect((device as Device).accept(visitor)).toBe(result);
    expect(visitor[method as keyof typeof visitor]).toHaveBeenCalledWith(
      device,
    );
  });
});
