import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DeviceEvent,
  DeviceTypes,
  Fan,
  Home,
  HomeRepository,
  Light,
  OutdoorSensorsUpdate,
  Room,
  SmartLock,
  Thermostat,
  WeatherForecast,
  Window,
} from "../../domain";
import { InMemoryHomeRepository } from "../../infrastructure/repositories/InMemoryHomeRepository";
import { InMemorySensorRegistry } from "../../infrastructure/InMemorySensorRegistry";
import { HomeService } from "./HomeService";

const buildHome = (id = "1"): Home =>
  new Home(id, { latitude: 0, longitude: 0 }, [
    new Room("room-1", "Living Room", [
      new Light("light-1", "Main Light", "room-1"),
      new Thermostat("therm-1", "Hall", "room-1"),
      new Window("window-1", "Bay Window", "room-1"),
    ]),
    new Room("room-2", "Bedroom", [
      new Light("light-2", "Bed Light", "room-2", true),
      new SmartLock("lock-1", "Front Door", "room-2"),
      new Fan("fan-1", "Tower Fan", "room-2"),
    ]),
  ]);

const makePorts = () => ({
  sensorUpdatePort: {
    sendIndoorTemperatureUpdate: vi.fn(),
    sendOutdoorTemperatureUpdate: vi.fn(),
    sendAirQualityUpdate: vi.fn(),
    sendWindUpdate: vi.fn(),
    sendWeatherUpdate: vi.fn(),
  },
  ruleServicePort: { evaluateRules: vi.fn() },
  outdoorSensorsDataPort: { getOutdoorSensorsData: vi.fn() },
  deviceUpdatePort: { sendDeviceUpdate: vi.fn(), sendDeviceRemoved: vi.fn() },
});

const outdoorUpdate: OutdoorSensorsUpdate = {
  outdoorTemperature: { temperature: 10 },
  airQuality: { AQI: 42 },
  wind: { windDirection: 90, windSpeed: 5 },
  weather: { forecast: WeatherForecast.Clear, precipitation: 0 },
};

describe("HomeService", () => {
  let repo: InMemoryHomeRepository;
  let registry: InMemorySensorRegistry;
  let home: Home;
  let ports: ReturnType<typeof makePorts>;
  let service: HomeService;

  beforeEach(async () => {
    repo = new InMemoryHomeRepository();
    registry = new InMemorySensorRegistry();
    home = buildHome("1");
    await repo.saveHome(home);
    ports = makePorts();
    service = new HomeService(
      repo,
      registry,
      ports.sensorUpdatePort,
      ports.ruleServicePort,
      ports.outdoorSensorsDataPort,
      ports.deviceUpdatePort,
    );
  });

  describe("getters", () => {
    it("getDevices returns every device across rooms", async () => {
      const devices = await service.getDevices("1");
      expect(devices.map((d) => d.id).sort()).toEqual([
        "fan-1",
        "light-1",
        "light-2",
        "lock-1",
        "therm-1",
        "window-1",
      ]);
    });

    it("getDevicesWithRoomNames pairs each device with its room name", async () => {
      const items = await service.getDevicesWithRoomNames("1");
      const light1 = items.find((i) => i.device.id === "light-1");
      expect(light1?.roomName).toBe("Living Room");
    });

    it("getRooms returns the home rooms", async () => {
      const rooms = await service.getRooms("1");
      expect(rooms.map((r) => r.name)).toEqual(["Living Room", "Bedroom"]);
    });

    it("getDeviceEvents returns events sorted newest first", async () => {
      const base = { deviceId: "light-1", deviceType: DeviceTypes.LIGHT };
      home.eventLog.push(
        {
          ...base,
          eventType: "LightTurnedOn",
          createdAt: new Date(1000),
        } as DeviceEvent,
        {
          ...base,
          eventType: "LightTurnedOff",
          createdAt: new Date(3000),
        } as DeviceEvent,
        {
          ...base,
          eventType: "LightTurnedOn",
          createdAt: new Date(2000),
        } as DeviceEvent,
      );

      const events = await service.getDeviceEvents("1");

      expect(events.map((e) => e.createdAt.getTime())).toEqual([
        3000, 2000, 1000,
      ]);
    });

    it.each([
      [DeviceTypes.LIGHT, ["light-1", "light-2"]],
      [DeviceTypes.THERMOSTAT, ["therm-1"]],
      [DeviceTypes.WINDOW, ["window-1"]],
      [DeviceTypes.LOCK, ["lock-1"]],
      [DeviceTypes.FAN, ["fan-1"]],
    ])("getDevicesByType filters by %s", async (type, expectedIds) => {
      const devices = await service.getDevicesByType("1", type);
      expect(devices.map((d) => d.id).sort()).toEqual([...expectedIds].sort());
    });

    it("getDevicesByType returns [] for an unknown type", async () => {
      expect(await service.getDevicesByType("1", "spaceship")).toEqual([]);
    });

    it("getDevice returns the device when found", async () => {
      expect((await service.getDevice("light-1"))?.id).toBe("light-1");
    });

    it("getDevice throws when the device is unknown", async () => {
      await expect(service.getDevice("zzz")).rejects.toThrow(
        "Device not found",
      );
    });

    it("getHomeCoordinates returns the home coordinates", async () => {
      expect(await service.getHomeCoordinates("1")).toEqual({
        latitude: 0,
        longitude: 0,
      });
    });

    it("getLocationName returns null when unset and the name when set", async () => {
      expect(await service.getLocationName("1")).toBeNull();
      home.coordinates.locationName = "Milan";
      expect(await service.getLocationName("1")).toBe("Milan");
    });

    it("getHourlyTemperatures returns the 24-slot plan", async () => {
      const temps = await service.getHourlyTemperatures("1");
      expect(temps).toHaveLength(24);
    });

    it("propagates the not-found error from a missing home", async () => {
      await expect(service.getDevices("999")).rejects.toThrow(
        "Home 999 not found",
      );
    });
  });

  describe("addDevice", () => {
    it("adds the device, persists and broadcasts", async () => {
      const saveSpy = vi.spyOn(repo, "saveHome");

      const device = await service.addDevice("1", {
        name: "Desk Lamp",
        type: DeviceTypes.LIGHT,
        roomId: "room-1",
      });

      expect(home.getDeviceById(device.id)).toBeDefined();
      expect(saveSpy).toHaveBeenCalledWith(home);
      expect(ports.deviceUpdatePort.sendDeviceUpdate).toHaveBeenCalledWith(
        home,
        device,
      );
    });

    it("throws when the room does not exist", async () => {
      await expect(
        service.addDevice("1", {
          name: "Desk Lamp",
          type: DeviceTypes.LIGHT,
          roomId: "nope",
        }),
      ).rejects.toThrow("Room not found");
    });
  });

  describe("updateDeviceName", () => {
    it("renames the device, persists and broadcasts", async () => {
      const saveSpy = vi.spyOn(repo, "saveHome");

      const { device, roomName } = await service.updateDeviceName(
        "1",
        "light-1",
        "Reading Lamp",
      );

      expect(device.name).toBe("Reading Lamp");
      expect(home.getDeviceById("light-1")?.name).toBe("Reading Lamp");
      expect(roomName).toBe("Living Room");
      expect(saveSpy).toHaveBeenCalledWith(home);
      expect(ports.deviceUpdatePort.sendDeviceUpdate).toHaveBeenCalledWith(
        home,
        device,
      );
    });

    it("rejects an empty name", async () => {
      await expect(
        service.updateDeviceName("1", "light-1", "   "),
      ).rejects.toThrow("name must be a non-empty string");
    });

    it("throws when the device is missing", async () => {
      await expect(service.updateDeviceName("1", "zzz", "X")).rejects.toThrow(
        "Device not found",
      );
    });
  });

  describe("deleteDevice", () => {
    it("removes the device, persists and broadcasts the removal", async () => {
      const saveSpy = vi.spyOn(repo, "saveHome");

      await service.deleteDevice("1", "light-1");

      expect(home.getDeviceById("light-1")).toBeUndefined();
      expect(saveSpy).toHaveBeenCalledWith(home);
      expect(ports.deviceUpdatePort.sendDeviceRemoved).toHaveBeenCalledWith(
        home,
        "light-1",
      );
    });

    it("throws when the device is missing", async () => {
      await expect(service.deleteDevice("1", "zzz")).rejects.toThrow(
        "Device not found",
      );
    });
  });

  describe("executeAction", () => {
    const actor = { username: "alice", role: "admin" };

    it("runs the action, records the event with the actor and returns the room name", async () => {
      const result = await service.executeAction(
        "1",
        "light-1",
        "turnOn",
        undefined,
        actor,
      );

      expect((home.getDeviceById("light-1") as Light).isOn).toBe(true);
      expect(home.eventLog.at(-1)?.actor).toEqual(actor);
      expect(result.roomName).toBe("Living Room");
    });

    it("records setTemperature into the hourly plan", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T08:30:00+01:00")); // local hour 8
      try {
        await service.executeAction("1", "therm-1", "setTemperature", 26);
        expect(home.hourlyTemperatures[8]).toBe(26);
      } finally {
        vi.useRealTimers();
      }
    });

    it("throws when the device is missing", async () => {
      await expect(service.executeAction("1", "zzz", "turnOn")).rejects.toThrow(
        "Device not found",
      );
    });

    it("throws when the action is not supported by the device", async () => {
      await expect(
        service.executeAction("1", "light-1", "explode"),
      ).rejects.toThrow("Action not supported");
    });
  });

  describe("setHourlyTemperatures", () => {
    it("rejects a plan that is not exactly 24 values", async () => {
      await expect(
        service.setHourlyTemperatures("1", [20, 21, 22]),
      ).rejects.toThrow("exactly 24 values");
    });

    it("stores the plan, aligns the thermostat to the current hour and broadcasts", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T08:30:00+01:00")); // local hour 8
      try {
        const plan = new Array(24).fill(20);
        plan[8] = 27;

        await service.setHourlyTemperatures("1", plan);

        const thermostat = home.getDeviceById("therm-1") as Thermostat;
        expect(home.hourlyTemperatures).toBe(plan);
        expect(thermostat.temperature).toBe(27);
        expect(ports.deviceUpdatePort.sendDeviceUpdate).toHaveBeenCalledWith(
          home,
          thermostat,
        );
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("applyHourlyTemperaturePlan", () => {
    const date = new Date("2026-01-01T08:00:00+01:00"); // local hour 8

    it("applies the planned temperature for the current hour", async () => {
      home.hourlyTemperatures[8] = 21;

      await service.applyHourlyTemperaturePlan(date);

      expect(registry.getState("1")?.indoorTemperature).toEqual({
        temperature: 21,
      });
      expect(
        ports.sensorUpdatePort.sendIndoorTemperatureUpdate,
      ).toHaveBeenCalledWith(home, { temperature: 21 });
    });

    it("skips homes whose plan is not 24 values", async () => {
      home.hourlyTemperatures = [];

      await service.applyHourlyTemperaturePlan(date);

      expect(
        ports.sensorUpdatePort.sendIndoorTemperatureUpdate,
      ).not.toHaveBeenCalled();
    });

    it("skips when the planned hour has no numeric value", async () => {
      home.hourlyTemperatures[8] = undefined as unknown as number;

      await service.applyHourlyTemperaturePlan(date);

      expect(
        ports.sensorUpdatePort.sendIndoorTemperatureUpdate,
      ).not.toHaveBeenCalled();
    });
  });

  describe("indoor / outdoor broadcasting", () => {
    it("updateIndoorTemperature writes the registry and sends the update", async () => {
      await service.updateIndoorTemperature("1", { temperature: 19 });

      expect(registry.getState("1")?.indoorTemperature).toEqual({
        temperature: 19,
      });
      expect(
        ports.sensorUpdatePort.sendIndoorTemperatureUpdate,
      ).toHaveBeenCalledWith(home, { temperature: 19 });
    });

    it("sendOutdoorSensorsUpdate is a no-op when no outdoor state is known", async () => {
      await service.sendOutdoorSensorsUpdate("1");
      expect(
        ports.sensorUpdatePort.sendOutdoorTemperatureUpdate,
      ).not.toHaveBeenCalled();
    });

    it("sendOutdoorSensorsUpdate broadcasts all four outdoor channels", async () => {
      registry.setOutdoorSensorsUpdate("1", outdoorUpdate);

      await service.sendOutdoorSensorsUpdate("1");

      expect(
        ports.sensorUpdatePort.sendOutdoorTemperatureUpdate,
      ).toHaveBeenCalledWith(home, outdoorUpdate.outdoorTemperature);
      expect(ports.sensorUpdatePort.sendAirQualityUpdate).toHaveBeenCalledWith(
        home,
        outdoorUpdate.airQuality,
      );
      expect(ports.sensorUpdatePort.sendWindUpdate).toHaveBeenCalledWith(
        home,
        outdoorUpdate.wind,
      );
      expect(ports.sensorUpdatePort.sendWeatherUpdate).toHaveBeenCalledWith(
        home,
        outdoorUpdate.weather,
      );
    });

    it("sendIndoorSensorsUpdate is a no-op when no indoor temperature is known", async () => {
      const home2 = buildHome("2");
      await repo.saveHome(home2);

      await service.sendIndoorSensorsUpdate("2");

      expect(
        ports.sensorUpdatePort.sendIndoorTemperatureUpdate,
      ).not.toHaveBeenCalled();
    });
  });

  describe("pollAllHomesOutdoorSensorsData", () => {
    const makeWith = (homes: Home[]) => {
      const stubRepo = {
        getAllHomes: vi.fn().mockResolvedValue(homes),
        getHome: vi
          .fn()
          .mockImplementation(
            async (id: string) => homes.find((h) => h.id === id) ?? null,
          ),
        getDeviceById: vi.fn(),
        saveHome: vi.fn(),
      } as unknown as HomeRepository;
      const localPorts = makePorts();
      const localRegistry = new InMemorySensorRegistry();
      const svc = new HomeService(
        stubRepo,
        localRegistry,
        localPorts.sensorUpdatePort,
        localPorts.ruleServicePort,
        localPorts.outdoorSensorsDataPort,
        localPorts.deviceUpdatePort,
      );
      return { svc, localPorts, localRegistry };
    };

    it("stores the data, broadcasts and evaluates rules with the indoor temperature", async () => {
      const { svc, localPorts, localRegistry } = makeWith([buildHome("1")]);
      localPorts.outdoorSensorsDataPort.getOutdoorSensorsData.mockResolvedValue(
        outdoorUpdate,
      );

      await svc.pollAllHomesOutdoorSensorsData();

      expect(localRegistry.getState("1")?.outdoorSensors).toEqual(
        outdoorUpdate,
      );
      expect(
        localPorts.sensorUpdatePort.sendOutdoorTemperatureUpdate,
      ).toHaveBeenCalled();
      expect(localPorts.ruleServicePort.evaluateRules).toHaveBeenCalledWith(
        "1",
        outdoorUpdate,
        { temperature: 22 }, // seeded indoor temperature for home "1"
      );
    });

    it("skips rule evaluation when there is no indoor temperature", async () => {
      const { svc, localPorts } = makeWith([buildHome("2")]); // registry has no "2"
      localPorts.outdoorSensorsDataPort.getOutdoorSensorsData.mockResolvedValue(
        outdoorUpdate,
      );

      await svc.pollAllHomesOutdoorSensorsData();

      expect(
        localPorts.sensorUpdatePort.sendOutdoorTemperatureUpdate,
      ).toHaveBeenCalled();
      expect(localPorts.ruleServicePort.evaluateRules).not.toHaveBeenCalled();
    });

    it("swallows per-home errors so one failure does not break the others", async () => {
      const { svc, localPorts } = makeWith([buildHome("1")]);
      localPorts.outdoorSensorsDataPort.getOutdoorSensorsData.mockRejectedValue(
        new Error("ext api down"),
      );

      await expect(
        svc.pollAllHomesOutdoorSensorsData(),
      ).resolves.toBeUndefined();
      expect(localPorts.ruleServicePort.evaluateRules).not.toHaveBeenCalled();
    });
  });
});
