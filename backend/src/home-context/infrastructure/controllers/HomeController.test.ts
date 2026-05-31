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

const jsonArg = (res: Response) =>
  (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];

describe("HomeController", () => {
  let controller: HomeController;
  let sensorRegistry: InMemorySensorRegistry;
  let notificationPort: { notifyDeviceAction: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const homeRepo = new InMemoryHomeRepository();
    sensorRegistry = new InMemorySensorRegistry();
    const sensorUpdatePort = {
      sendIndoorTemperatureUpdate: vi.fn(),
      sendOutdoorTemperatureUpdate: vi.fn(),
      sendAirQualityUpdate: vi.fn(),
      sendWindUpdate: vi.fn(),
      sendWeatherUpdate: vi.fn(),
    };
    const ruleServicePort = {
      evaluateRules: vi.fn(),
    };
    const outdoorSensorsDataPort = {
      getOutdoorSensorsData: vi.fn(),
    };

    const homeService = new HomeService(
      homeRepo,
      sensorRegistry,
      sensorUpdatePort,
      ruleServicePort,
      outdoorSensorsDataPort,
    );

    notificationPort = {
      notifyDeviceAction: vi.fn().mockResolvedValue(undefined),
    };
    controller = new HomeController(homeService, notificationPort);
  });

  it("updates the sensor registry on indoor temperature update", async () => {
    const req = {
      params: { id: "1" },
      body: { temperature: 21 },
    } as unknown as Request;
    const res = createResponse();

    await controller.updateIndoorTemperature(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Indoor temperature updated",
    });
    expect(sensorRegistry.getState("1")?.indoorTemperature).toEqual({
      temperature: 21,
    });
  });

  it("returns 400 when temperature is not a number", async () => {
    const req = {
      params: { id: "1" },
      body: { temperature: "21" },
    } as unknown as Request;
    const res = createResponse();

    await controller.updateIndoorTemperature(req, res);

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

  describe("read endpoints", () => {
    it("getDevices returns serialized devices with their room name", async () => {
      const req = { params: { id: "1" } } as unknown as Request;
      const res = createResponse();

      await controller.getDevices(req, res);

      const devices = jsonArg(res);
      expect(devices.find((d: any) => d.id === "light-1")).toMatchObject({
        id: "light-1",
        type: "light",
        roomName: "Living Room",
      });
    });

    it("getDevices returns 404 for an unknown home", async () => {
      const req = { params: { id: "999" } } as unknown as Request;
      const res = createResponse();

      await controller.getDevices(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("getRooms returns id/name pairs", async () => {
      const req = { params: { id: "1" } } as unknown as Request;
      const res = createResponse();

      await controller.getRooms(req, res);

      expect(jsonArg(res)).toEqual([
        { id: "room-1", name: "Living Room" },
        { id: "room-2", name: "Bedroom" },
      ]);
    });

    it("getDevicesByType filters by the requested type", async () => {
      const req = { params: { id: "1", type: "light" } } as unknown as Request;
      const res = createResponse();

      await controller.getDevicesByType(req, res);

      const devices = jsonArg(res);
      expect(devices.map((d: any) => d.id).sort()).toEqual([
        "light-1",
        "light-2",
      ]);
    });

    it("getDevice returns the serialized device", async () => {
      const req = { params: { deviceId: "light-1" } } as unknown as Request;
      const res = createResponse();

      await controller.getDevice(req, res);

      expect(jsonArg(res)).toMatchObject({ id: "light-1", type: "light" });
    });

    it("getDevice returns 404 when the device is unknown", async () => {
      const req = { params: { deviceId: "zzz" } } as unknown as Request;
      const res = createResponse();

      await controller.getDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Device not found" });
    });

    it("getLocationName returns null when the home has no location name", async () => {
      const req = { params: { id: "1" } } as unknown as Request;
      const res = createResponse();

      await controller.getLocationName(req, res);

      expect(res.json).toHaveBeenCalledWith({ locationName: null });
    });

    it("getHourlyTemperatures returns the 24-slot plan", async () => {
      const req = { params: { id: "1" } } as unknown as Request;
      const res = createResponse();

      await controller.getHourlyTemperatures(req, res);

      expect(jsonArg(res)).toHaveLength(24);
    });
  });

  describe("executeAction", () => {
    const actionReq = (overrides: Record<string, unknown>) =>
      ({
        params: { id: "1", deviceId: "light-1", action: "turnOn" },
        body: {},
        ...overrides,
      }) as unknown as Request;

    it("executes the action and returns the device with its room name", async () => {
      const req = actionReq({});
      const res = createResponse();

      await controller.executeAction(req, res);

      expect(jsonArg(res)).toMatchObject({
        id: "light-1",
        isOn: true,
        roomName: "Living Room",
      });
    });

    it("notifies the notification port when an authenticated user acts", async () => {
      const req = actionReq({ user: { username: "alice", role: "admin" } });
      const res = createResponse();

      await controller.executeAction(req, res);

      expect(notificationPort.notifyDeviceAction).toHaveBeenCalledWith("1", {
        deviceId: "light-1",
        deviceName: "Main Light",
        action: "turnOn",
        actor: { username: "alice", role: "admin" },
      });
    });

    it("does not notify when there is no authenticated user", async () => {
      const res = createResponse();

      await controller.executeAction(actionReq({}), res);

      expect(notificationPort.notifyDeviceAction).not.toHaveBeenCalled();
    });

    it("returns 400 when setTemperature is missing a numeric temperature", async () => {
      const req = actionReq({
        params: { id: "1", deviceId: "light-1", action: "setTemperature" },
        body: {},
      });
      const res = createResponse();

      await controller.executeAction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Temperature parameter must be a number",
      });
    });

    it("returns 400 when setMode is given an invalid mode", async () => {
      const req = actionReq({
        params: { id: "1", deviceId: "fan-1", action: "setMode" },
        body: { mode: "turbo" },
      });
      const res = createResponse();

      await controller.executeAction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Mode must be one of: off, low, medium, high",
      });
    });
  });

  describe("getDeviceEvents", () => {
    it("returns events with createdAt serialized to an ISO string", async () => {
      await controller.executeAction(
        {
          params: { id: "1", deviceId: "light-1", action: "turnOn" },
          body: {},
        } as unknown as Request,
        createResponse(),
      );

      const res = createResponse();
      await controller.getDeviceEvents(
        { params: { id: "1" } } as unknown as Request,
        res,
      );

      const { events } = jsonArg(res);
      expect(events).toHaveLength(1);
      expect(typeof events[0].createdAt).toBe("string");
      expect(Number.isNaN(Date.parse(events[0].createdAt))).toBe(false);
    });
  });

  describe("setHourlyTemperatures", () => {
    it("returns 400 when temperatures is not an array", async () => {
      const req = {
        params: { id: "1" },
        body: { temperatures: "not-an-array" },
      } as unknown as Request;
      const res = createResponse();

      await controller.setHourlyTemperatures(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Temperatures must be an array",
      });
    });
  });
});
