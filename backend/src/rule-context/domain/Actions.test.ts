import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FanSetModeAction,
  LightTurnOnAction,
  LightTurnOffAction,
  LockLockAction,
  LockUnlockAction,
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
} from "./Actions";

describe("Actions", () => {
  const homeId: string = "1";

  const mockVisitor = {
    visitLightTurnOnAction: vi.fn().mockReturnValue("light-on"),
    visitLightTurnOffAction: vi.fn().mockReturnValue("light-off"),
    visitWindowOpenAction: vi.fn().mockReturnValue("window-open"),
    visitWindowCloseAction: vi.fn().mockReturnValue("window-close"),
    visitThermostatSetTemperatureAction: vi.fn().mockReturnValue("thermo-set"),
    visitLockLockAction: vi.fn().mockReturnValue("lock-lock"),
    visitLockUnlockAction: vi.fn().mockReturnValue("lock-unlock"),
    visitFanSetModeAction: vi.fn().mockReturnValue("fan-set-mode"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LightTurnOnAction", () => {
    const action = new LightTurnOnAction(homeId, "comp-1");

    it("should return device id", () => {
      expect(action.getDeviceId()).toBe("comp-1");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("light-on");
      expect(mockVisitor.visitLightTurnOnAction).toHaveBeenCalledWith(action);
    });
  });

  describe("LightTurnOffAction", () => {
    const action = new LightTurnOffAction(homeId, "comp-2");

    it("should return device id", () => {
      expect(action.getDeviceId()).toBe("comp-2");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("light-off");
      expect(mockVisitor.visitLightTurnOffAction).toHaveBeenCalledWith(action);
    });
  });

  describe("WindowOpenAction", () => {
    const action = new WindowOpenAction(homeId, "comp-3");

    it("should return device id", () => {
      expect(action.getDeviceId()).toBe("comp-3");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("window-open");
      expect(mockVisitor.visitWindowOpenAction).toHaveBeenCalledWith(action);
    });
  });

  describe("WindowCloseAction", () => {
    const action = new WindowCloseAction(homeId, "comp-4");

    it("should return device id", () => {
      expect(action.getDeviceId()).toBe("comp-4");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("window-close");
      expect(mockVisitor.visitWindowCloseAction).toHaveBeenCalledWith(action);
    });
  });

  describe("ThermostatSetTemperatureAction", () => {
    const action = new ThermostatSetTemperatureAction(homeId, "comp-5", 25);

    it("should return device id and target temperature", () => {
      expect(action.getDeviceId()).toBe("comp-5");
      expect(action.targetTemperature).toBe(25);
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("thermo-set");
      expect(
        mockVisitor.visitThermostatSetTemperatureAction,
      ).toHaveBeenCalledWith(action);
    });
  });

  describe("LockLockAction", () => {
    const action = new LockLockAction(homeId, "comp-6");

    it("should return device id", () => {
      expect(action.getDeviceId()).toBe("comp-6");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("lock-lock");
      expect(mockVisitor.visitLockLockAction).toHaveBeenCalledWith(action);
    });
  });

  describe("LockUnlockAction", () => {
    const action = new LockUnlockAction(homeId, "comp-7");

    it("should return device id", () => {
      expect(action.getDeviceId()).toBe("comp-7");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("lock-unlock");
      expect(mockVisitor.visitLockUnlockAction).toHaveBeenCalledWith(action);
    });
  });

  describe("FanSetModeAction", () => {
    const action = new FanSetModeAction(homeId, "comp-8", "low");

    it("should return device id and mode", () => {
      expect(action.getDeviceId()).toBe("comp-8");
      expect(action.mode).toBe("low");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("fan-set-mode");
      expect(mockVisitor.visitFanSetModeAction).toHaveBeenCalledWith(action);
    });
  });
});
