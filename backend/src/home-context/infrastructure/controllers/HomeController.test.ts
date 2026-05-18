import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
import { HomeController } from "./HomeController";
import { HomeService } from "../../application/HomeService";
import { InMemoryHomeRepository } from "../InMemoryHomeRepository";
import { InMemorySensorRegistry } from "../InMemorySensorRegistry";

const createResponse = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

describe("HomeController", () => {
  let controller: HomeController;
  let sensorRegistry: InMemorySensorRegistry;

  beforeEach(() => {
    const homeRepo = new InMemoryHomeRepository();
    sensorRegistry = new InMemorySensorRegistry();
    const sensorUpdatePort = {
      sendInternalTemperatureUpdate: vi.fn(),
      sendExternalTemperatureUpdate: vi.fn(),
      sendAirQualityUpdate: vi.fn(),
      sendWindUpdate: vi.fn(),
      sendWeatherUpdate: vi.fn(),
    };
    const ruleServicePort = {
      evaluateRules: vi.fn(),
    };
    const externalSensorsDataPort = {
      getExternalSensorsData: vi.fn(),
    };

    const homeService = new HomeService(
      homeRepo,
      sensorRegistry,
      sensorUpdatePort,
      ruleServicePort,
      externalSensorsDataPort,
    );

    controller = new HomeController(homeService);
  });

  it("updates the sensor registry on internal temperature update", async () => {
    const req = {
      params: { id: "1" },
      body: { temperature: 21 },
    } as unknown as Request;
    const res = createResponse();

    await controller.updateInternalTemperature(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal temperature updated",
    });
    expect(sensorRegistry.getState("1")?.internalTemperature).toEqual({
      temperature: 21,
    });
  });

  it("returns 400 when temperature is not a number", async () => {
    const req = {
      params: { id: "1" },
      body: { temperature: "21" },
    } as unknown as Request;
    const res = createResponse();

    await controller.updateInternalTemperature(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Temperature must be a number",
    });
  });
});
