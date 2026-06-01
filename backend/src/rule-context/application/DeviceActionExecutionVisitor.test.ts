import { describe, it, expect, vi } from "vitest";
import {
  FanSetModeAction,
  LightTurnOffAction,
  LightTurnOnAction,
  LockLockAction,
  LockUnlockAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../domain/Actions";
import { ActionExecutionPort } from "../domain/ActionExecutionPort";
import { DeviceActionExecutionVisitor } from "./DeviceActionExecutionVisitor";

const makePort = () => ({
  executeLightTurnOn: vi.fn().mockResolvedValue(undefined),
  executeLightTurnOff: vi.fn().mockResolvedValue(undefined),
  executeWindowOpen: vi.fn().mockResolvedValue(undefined),
  executeWindowClose: vi.fn().mockResolvedValue(undefined),
  executeThermostatSetTemperature: vi.fn().mockResolvedValue(undefined),
  executeLockLock: vi.fn().mockResolvedValue(undefined),
  executeLockUnlock: vi.fn().mockResolvedValue(undefined),
  executeFanSetMode: vi.fn().mockResolvedValue(undefined),
});

describe("DeviceActionExecutionVisitor", () => {
  it.each([
    [
      "visitLightTurnOnAction",
      new LightTurnOnAction("h", "d"),
      "executeLightTurnOn",
    ],
    [
      "visitLightTurnOffAction",
      new LightTurnOffAction("h", "d"),
      "executeLightTurnOff",
    ],
    [
      "visitWindowOpenAction",
      new WindowOpenAction("h", "d"),
      "executeWindowOpen",
    ],
    [
      "visitWindowCloseAction",
      new WindowCloseAction("h", "d"),
      "executeWindowClose",
    ],
    [
      "visitThermostatSetTemperatureAction",
      new ThermostatSetTemperatureAction("h", "d", 21),
      "executeThermostatSetTemperature",
    ],
    ["visitLockLockAction", new LockLockAction("h", "d"), "executeLockLock"],
    [
      "visitLockUnlockAction",
      new LockUnlockAction("h", "d"),
      "executeLockUnlock",
    ],
    [
      "visitFanSetModeAction",
      new FanSetModeAction("h", "d", "high"),
      "executeFanSetMode",
    ],
  ])(
    "%s delegates to the matching port method",
    async (method, action, portMethod) => {
      const port = makePort();
      const visitor = new DeviceActionExecutionVisitor(
        port as unknown as ActionExecutionPort,
      );

      await (
        visitor as unknown as Record<string, (a: unknown) => Promise<void>>
      )[method](action);

      expect(port[portMethod as keyof typeof port]).toHaveBeenCalledWith(
        action,
      );
    },
  );

  it("dispatches through action.accept to the right port method", async () => {
    const port = makePort();
    const visitor = new DeviceActionExecutionVisitor(
      port as unknown as ActionExecutionPort,
    );
    const action = new LightTurnOnAction("h", "d");

    await action.accept(visitor);

    expect(port.executeLightTurnOn).toHaveBeenCalledWith(action);
  });
});
