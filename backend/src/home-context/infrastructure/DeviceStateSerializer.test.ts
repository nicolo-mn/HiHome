import { describe, it, expect } from "vitest";
import {
  DeviceTypes,
  Fan,
  Light,
  SmartLock,
  Thermostat,
  Window,
} from "../domain";
import { DeviceStateSerializer } from "./DeviceStateSerializer";

const serializer = new DeviceStateSerializer();

describe("DeviceStateSerializer", () => {
  it("serializes a Light with its on/off state", () => {
    const light = new Light("l1", "Main", "room-1", true);
    expect(light.accept(serializer)).toEqual({
      id: "l1",
      name: "Main",
      roomId: "room-1",
      type: DeviceTypes.LIGHT,
      isOn: true,
    });
  });

  it("serializes a Window with its open state", () => {
    const window = new Window("w1", "Kitchen", "room-1", true);
    expect(window.accept(serializer)).toEqual({
      id: "w1",
      name: "Kitchen",
      roomId: "room-1",
      type: DeviceTypes.WINDOW,
      isOpen: true,
    });
  });

  it("serializes a Thermostat with its temperature", () => {
    const thermostat = new Thermostat("t1", "Hall", "room-1", 24);
    expect(thermostat.accept(serializer)).toEqual({
      id: "t1",
      name: "Hall",
      roomId: "room-1",
      type: DeviceTypes.THERMOSTAT,
      temperature: 24,
    });
  });

  it("serializes a SmartLock with its locked state", () => {
    const lock = new SmartLock("s1", "Front", "room-1", false);
    expect(lock.accept(serializer)).toEqual({
      id: "s1",
      name: "Front",
      roomId: "room-1",
      type: DeviceTypes.LOCK,
      isLocked: false,
    });
  });

  it("serializes a Fan with its mode", () => {
    const fan = new Fan("f1", "Tower", "room-1", "medium");
    expect(fan.accept(serializer)).toEqual({
      id: "f1",
      name: "Tower",
      roomId: "room-1",
      type: DeviceTypes.FAN,
      mode: "medium",
    });
  });
});
