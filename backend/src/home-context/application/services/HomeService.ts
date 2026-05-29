import { randomUUID } from "crypto";
import {
  Device,
  Light,
  Coordinates,
  Window,
  Thermostat,
  Home,
  HomeRepository,
  DeviceTypes,
  DeviceEvent,
  DeviceEventActor,
  TemperatureState,
  SensorUpdatePort,
  ExternalSensorsUpdate,
  Room,
  createDevice,
  DeviceUpdatePort,
  SmartLock,
  Fan,
} from "../../domain";
import { SensorRegistry } from "../SensorRegistry";
import { ExternalSensorsDataPort } from "../ports/ExternalSensorsDataPort";
import { RuleServicePort } from "../ports/RuleServicePort";
import { CreateDeviceInput } from "../dtos/DeviceDTO";
import { ensureHomeExists, persistAndBroadcast } from "./ServiceHelpers";

export class HomeService {
  constructor(
    private homeRepo: HomeRepository,
    private sensorRegistry: SensorRegistry,
    private sensorUpdatePort: SensorUpdatePort,
    private ruleServicePort: RuleServicePort,
    private externalSensorsDataPort: ExternalSensorsDataPort,
    private deviceUpdatePort?: DeviceUpdatePort,
  ) {}

  async getDevices(homeId: string): Promise<Device[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.getAllDevices();
  }

  async getDevicesWithRoomNames(
    homeId: string,
  ): Promise<{ device: Device; roomName: string }[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.rooms.flatMap((room) =>
      room.devices.map((device) => ({ device: device, roomName: room.name })),
    );
  }

  async getRooms(homeId: string): Promise<Room[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.rooms;
  }

  async getDevice(deviceId: string): Promise<Device | undefined> {
    const device = await this.homeRepo.getDeviceById(deviceId);
    if (!device) throw new Error("Device not found");
    return device;
  }

  async getDeviceEvents(homeId: string): Promise<DeviceEvent[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return [...home.eventLog].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async addDevice(homeId: string, input: CreateDeviceInput): Promise<Device> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const room = home.rooms.find((r) => r.id === input.roomId);
    if (!room) throw new Error("Room not found");

    const device = createDevice(randomUUID(), input);
    room.devices.push(device);
    await this.homeRepo.saveHome(home);
    return device;
  }

  async executeAction(
    homeId: string,
    deviceId: string,
    action: string,
    param?: number | string,
    actor?: DeviceEventActor,
  ): Promise<{ device: Device; roomName: string }> {
    const home = await ensureHomeExists(this.homeRepo, homeId);

    const device = home.getDeviceById(deviceId);
    if (!device) {
      console.error(
        `Failed to execute action ${action}: Device ${deviceId} not found in home ${homeId}`,
      );
      throw new Error("Device not found");
    }

    if (typeof (device as any)[action] !== "function") {
      console.error(
        `Failed to execute action ${action}: Action not supported on device ${deviceId}`,
      );
      throw new Error("Action not supported");
    }

    console.log(
      `Executing device action ${action} for home ${homeId} on device ${deviceId}`,
    );
    await persistAndBroadcast(
      this.homeRepo,
      home,
      device,
      this.deviceUpdatePort,
    );
    const event = (device as any)[action](param) as DeviceEvent;
    if (event) {
      home.addDeviceEvent({ ...event, actor });
    }

    await this.homeRepo.saveHome(home);
    const room = home.rooms.find((r) => r.id === device.roomId);
    return { device, roomName: room?.name ?? "" };
  }

  async getDeviceTypes(): Promise<string[]> {
    return Object.values(DeviceTypes); // The device types come from an enum
  }

  async getDevicesByType(homeId: string, type: string): Promise<Device[]> {
    const devices = await this.getDevices(homeId);
    return devices.filter((c) => {
      if (type === DeviceTypes.LIGHT) return c instanceof Light;
      if (type === DeviceTypes.WINDOW) return c instanceof Window;
      if (type === DeviceTypes.THERMOSTAT) return c instanceof Thermostat;
      if (type === DeviceTypes.LOCK) return c instanceof SmartLock;
      if (type === DeviceTypes.FAN) return c instanceof Fan;
      return false;
    });
  }

  async getHomeCoordinates(homeId: string): Promise<Coordinates> {
    console.log(`Fetching coordinates for home ${homeId}`);
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.coordinates;
  }

  async getLocationName(homeId: string): Promise<string | null> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.coordinates.locationName ?? null;
  }

  async getHourlyTemperatures(homeId: string): Promise<number[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.hourlyTemperatures;
  }

  async setHourlyTemperatures(
    homeId: string,
    temperatures: number[],
  ): Promise<void> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    if (temperatures.length !== 24) {
      throw new Error("Hourly temperatures must have exactly 24 values");
    }
    home.hourlyTemperatures = temperatures;
    await this.homeRepo.saveHome(home);
  }

  async applyHourlyTemperaturePlan(date = new Date()): Promise<void> {
    const hour = date.getHours();
    const homes = await this.homeRepo.getAllHomes();

    await Promise.all(
      homes.map(async (home) => {
        const plan = Array.isArray(home.hourlyTemperatures)
          ? home.hourlyTemperatures
          : [];
        if (plan.length !== 24) {
          console.warn(
            `Hourly temperature plan invalid for home ${home.id}, skipping update`,
          );
          return;
        }

        const temperature = plan[hour];
        if (typeof temperature !== "number") {
          console.warn(
            `Hourly temperature missing for home ${home.id} at hour ${hour}, skipping update`,
          );
          return;
        }

        await this.updateInternalTemperature(home.id, { temperature });
      }),
    );
  }

  async sendExternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await ensureHomeExists(this.homeRepo, homeId);

    const resolvedUpdate =
      this.sensorRegistry.getState(homeId)?.externalSensors;
    if (!resolvedUpdate) return;

    this.sendExternalSensorsUpdateToClients(home, resolvedUpdate);
  }

  async sendInternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await ensureHomeExists(this.homeRepo, homeId);

    const resolvedTemperature =
      this.sensorRegistry.getState(homeId)?.internalTemperature;
    if (resolvedTemperature === undefined) return;

    this.sendInternalSensorsUpdateToClients(home, resolvedTemperature);
  }

  async pollAllHomesExternalSensorsData(): Promise<void> {
    const homes = await this.homeRepo.getAllHomes();

    await Promise.all(
      homes.map(async (home) => {
        try {
          const extSensorsData =
            await this.externalSensorsDataPort.getExternalSensorsData(home);

          console.log(
            `External sensors update received for home ${home.id}: temp=${extSensorsData.externalTemperature.temperature} AQI=${extSensorsData.airQuality.AQI}`,
          );

          this.sensorRegistry.setExternalSensorsUpdate(home.id, extSensorsData);

          await this.sendExternalSensorsUpdate(home.id);

          const internalTemperatureValue = this.sensorRegistry.getState(
            home.id,
          )?.internalTemperature;
          if (internalTemperatureValue === undefined) {
            console.warn(
              `No internal temperature found for home ${home.id}, skipping rules evaluation`,
            );
            return;
          }

          const internalTemperature: TemperatureState =
            internalTemperatureValue;

          this.sendInternalSensorsUpdateToClients(
            home,
            internalTemperatureValue,
          );

          this.ruleServicePort.evaluateRules(
            home.id,
            extSensorsData,
            internalTemperature,
          );
        } catch (error) {
          console.error(
            `Failed to poll external sensors data for home ${home.id}:`,
            error,
          );
        }
      }),
    );
  }

  async updateInternalTemperature(
    homeId: string,
    update: TemperatureState,
  ): Promise<void> {
    this.sensorRegistry.setInternalTemperature(homeId, update);
    console.log(
      `Internal temperature update received for home ${homeId}: temp=${update.temperature}`,
    );
    await this.sendInternalSensorsUpdate(homeId);
  }

  private sendExternalSensorsUpdateToClients(
    home: Home,
    update: ExternalSensorsUpdate,
  ): void {
    this.sensorUpdatePort.sendExternalTemperatureUpdate(
      home,
      update.externalTemperature,
    );
    this.sensorUpdatePort.sendAirQualityUpdate(home, update.airQuality);
    this.sensorUpdatePort.sendWindUpdate(home, update.wind);
    this.sensorUpdatePort.sendWeatherUpdate(home, update.weather);
  }

  private sendInternalSensorsUpdateToClients(
    home: Home,
    update: TemperatureState,
  ): void {
    this.sensorUpdatePort.sendInternalTemperatureUpdate(home, update);
  }
}
