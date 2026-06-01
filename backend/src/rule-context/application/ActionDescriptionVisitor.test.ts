import { describe, it, expect } from "vitest";
import {
  DeviceAction,
  FanSetModeAction,
  LightTurnOffAction,
  LightTurnOnAction,
  LockLockAction,
  LockUnlockAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../domain/Actions";
import { ActionDescriptionVisitor } from "./ActionDescriptionVisitor";

const names = new Map<string, string>([["d1", "Living Room Light"]]);

describe("ActionDescriptionVisitor", () => {
  const visitor = new ActionDescriptionVisitor(names);

  it.each<[DeviceAction, string]>([
    [new LightTurnOnAction("h", "d1"), "Turn on light Living Room Light"],
    [new LightTurnOffAction("h", "d1"), "Turn off light Living Room Light"],
    [new WindowOpenAction("h", "d1"), "Open window Living Room Light"],
    [new WindowCloseAction("h", "d1"), "Close window Living Room Light"],
    [new LockLockAction("h", "d1"), "Lock Living Room Light"],
    [new LockUnlockAction("h", "d1"), "Unlock Living Room Light"],
    [
      new ThermostatSetTemperatureAction("h", "d1", 22),
      "Set thermostat Living Room Light to 22°C",
    ],
    [
      new FanSetModeAction("h", "d1", "high"),
      "Set fan Living Room Light to high",
    ],
  ])(
    "describes the action using the resolved device name",
    (action, expected) => {
      expect(action.accept(visitor)).toBe(expected);
    },
  );

  it("falls back to the device id when the name is not in the map", () => {
    const v = new ActionDescriptionVisitor(new Map());
    expect(new LightTurnOnAction("h", "unknown-id").accept(v)).toBe(
      "Turn on light unknown-id",
    );
  });
});
