import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LightTurnOnAction,
  LightTurnOffAction,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LightTurnOnAction", () => {
    const action = new LightTurnOnAction(homeId, "comp-1");

    it("should return component id", () => {
      expect(action.getComponentId()).toBe("comp-1");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("light-on");
      expect(mockVisitor.visitLightTurnOnAction).toHaveBeenCalledWith(action);
    });
  });

  describe("LightTurnOffAction", () => {
    const action = new LightTurnOffAction(homeId, "comp-2");

    it("should return component id", () => {
      expect(action.getComponentId()).toBe("comp-2");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("light-off");
      expect(mockVisitor.visitLightTurnOffAction).toHaveBeenCalledWith(action);
    });
  });

  describe("WindowOpenAction", () => {
    const action = new WindowOpenAction(homeId, "comp-3");

    it("should return component id", () => {
      expect(action.getComponentId()).toBe("comp-3");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("window-open");
      expect(mockVisitor.visitWindowOpenAction).toHaveBeenCalledWith(action);
    });
  });

  describe("WindowCloseAction", () => {
    const action = new WindowCloseAction(homeId, "comp-4");

    it("should return component id", () => {
      expect(action.getComponentId()).toBe("comp-4");
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("window-close");
      expect(mockVisitor.visitWindowCloseAction).toHaveBeenCalledWith(action);
    });
  });

  describe("ThermostatSetTemperatureAction", () => {
    const action = new ThermostatSetTemperatureAction(homeId, "comp-5", 25);

    it("should return component id and target temperature", () => {
      expect(action.getComponentId()).toBe("comp-5");
      expect(action.targetTemperature).toBe(25);
    });

    it("should accept visitor", () => {
      expect(action.accept(mockVisitor)).toBe("thermo-set");
      expect(
        mockVisitor.visitThermostatSetTemperatureAction,
      ).toHaveBeenCalledWith(action);
    });
  });
});
