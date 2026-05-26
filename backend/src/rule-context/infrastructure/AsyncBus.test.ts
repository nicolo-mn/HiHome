import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import { AsyncBus } from "./AsyncBus";
import { RuleService } from "../application/services/RuleService";
import {
  ObservablesUpdatedDomainEvent,
  WeatherForecast,
} from "../domain/Observables";

describe("AsyncBus", () => {
  let eventEmitter: EventEmitter;
  let ruleService: RuleService;
  let asyncBus: AsyncBus;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    ruleService = {
      executeRulesForHome: vi.fn(),
    } as unknown as RuleService;

    asyncBus = new AsyncBus(eventEmitter, "observables.updated", ruleService);
  });

  it("should listen to specified event and call RuleService.executeRulesForHome", async () => {
    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 25,
      internalTemperature: 22,
      airQuality: 40,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };
    const homeId = "home-1";

    // emit the event
    eventEmitter.emit("observables.updated", homeId, update);

    // Give the async handler time to execute
    await new Promise(process.nextTick);

    expect(ruleService.executeRulesForHome).toHaveBeenCalledWith(
      homeId,
      update,
    );
  });

  it("should catch errors from executeRulesForHome and log them", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Test Error");
    vi.mocked(ruleService.executeRulesForHome).mockRejectedValue(error);

    const update: ObservablesUpdatedDomainEvent = {
      externalTemperature: 25,
      internalTemperature: 22,
      airQuality: 40,
      windSpeed: 10,
      weatherForecast: WeatherForecast.Clear,
    };

    eventEmitter.emit("observables.updated", "home-1", update);

    // Give the async handler time to execute
    await new Promise(process.nextTick);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error executing rules for home home-1 on event observables.updated:",
      error,
    );

    consoleSpy.mockRestore();
  });
});
