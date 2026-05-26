import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionExecutionAdapter } from "./ActionExecutionAdapter";
import {
  LightTurnOnAction,
  LightTurnOffAction,
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
} from "../../domain/Actions";

describe("ActionExecutionAdapter", () => {
  let mockActionService: any;
  let adapter: ActionExecutionAdapter;
  let homeId: string = "1";

  beforeEach(() => {
    mockActionService = {
      lightTurnOn: vi.fn(),
      lightTurnOff: vi.fn(),
      windowOpen: vi.fn(),
      windowClose: vi.fn(),
      thermostatSetTemperature: vi.fn(),
    };
    adapter = new ActionExecutionAdapter(mockActionService);
  });

  it("should execute light turn on", async () => {
    const action = new LightTurnOnAction(homeId, "comp-1");
    await adapter.executeLightTurnOn(action);
    expect(mockActionService.lightTurnOn).toHaveBeenCalledWith(
      homeId,
      "comp-1",
    );
  });

  it("should execute light turn off", async () => {
    const action = new LightTurnOffAction(homeId, "comp-2");
    await adapter.executeLightTurnOff(action);
    expect(mockActionService.lightTurnOff).toHaveBeenCalledWith(
      homeId,
      "comp-2",
    );
  });

  it("should execute window open", async () => {
    const action = new WindowOpenAction(homeId, "comp-3");
    await adapter.executeWindowOpen(action);
    expect(mockActionService.windowOpen).toHaveBeenCalledWith(homeId, "comp-3");
  });

  it("should execute window close", async () => {
    const action = new WindowCloseAction(homeId, "comp-4");
    await adapter.executeWindowClose(action);
    expect(mockActionService.windowClose).toHaveBeenCalledWith(
      homeId,
      "comp-4",
    );
  });

  it("should execute thermostat set temperature", async () => {
    const action = new ThermostatSetTemperatureAction(homeId, "comp-5", 24);
    await adapter.executeThermostatSetTemperature(action);
    expect(mockActionService.thermostatSetTemperature).toHaveBeenCalledWith(
      homeId,
      "comp-5",
      24,
    );
  });
});
