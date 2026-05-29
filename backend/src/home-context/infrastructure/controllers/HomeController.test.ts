import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
import { HomeController } from "./HomeController";
import { HomeService } from "../../application/services/HomeService";
import { InMemoryHomeRepository } from "../repositories/InMemoryHomeRepository";
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

  describe("addDevice", () => {
    const addRequest = (body: unknown, homeId = "1") =>
      ({ params: { id: homeId }, body }) as unknown as Request;

    it.each([
      ["light", { isOn: false }],
      ["window", { isOpen: false }],
      ["thermostat", { temperature: 20 }],
    ])("creates a %s with a generated id", async (type, extraState) => {
      const req = addRequest({ name: `My ${type}`, type, roomId: "room-1" });
      const res = createResponse();

      await controller.addDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).toMatchObject({
        name: `My ${type}`,
        type,
        roomId: "room-1",
        ...extraState,
      });
      expect(typeof payload.id).toBe("string");
      expect(payload.id.length).toBeGreaterThan(0);
    });

    it.each([
      [{ type: "light", roomId: "room-1" }, "name must be a non-empty string"],
      [{ name: "X", type: "light" }, "roomId must be a non-empty string"],
      [{ name: "X", roomId: "room-1" }, "Unsupported device type"],
      [
        { name: "X", type: "fridge", roomId: "room-1" },
        "Unsupported device type",
      ],
    ])("returns 400 on invalid body %#", async (body, expectedError) => {
      const req = addRequest(body);
      const res = createResponse();

      await controller.addDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expectedError });
    });

    it("returns 400 when the room does not exist", async () => {
      const req = addRequest({
        name: "Lamp",
        type: "light",
        roomId: "missing",
      });
      const res = createResponse();

      await controller.addDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Room not found" });
    });

    it("returns 400 when the home does not exist", async () => {
      const req = addRequest(
        { name: "Lamp", type: "light", roomId: "room-1" },
        "999",
      );
      const res = createResponse();

      await controller.addDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Home 999 not found" });
    });
  });
});
