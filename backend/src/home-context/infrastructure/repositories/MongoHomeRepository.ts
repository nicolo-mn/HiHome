import {
  Device,
  DeviceTypes,
  Coordinates,
  Fan,
  FanMode,
  Home,
  HomeRepository,
  Light,
  Room,
  SmartLock,
  Thermostat,
  Window,
  DeviceEvent,
} from "../../domain";
import { HomeModel } from "../models/HomeModel";

type DeviceRecord = {
  id: string;
  name: string;
  roomId: string;
  type: DeviceTypes;
  isOn?: boolean;
  isOpen?: boolean;
  isLocked?: boolean;
  temperature?: number;
  mode?: FanMode;
};

type RoomRecord = {
  id: string;
  name: string;
  devices: DeviceRecord[];
};

type HomeRecord = {
  id: string;
  coordinates: Coordinates;
  rooms: RoomRecord[];
  hourlyTemperatures?: number[];
  eventLog: DeviceEventRecord[];
};

type DeviceEventRecord = {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType: DeviceTypes;
  eventType?: string;
  targetTemperature?: number;
  mode?: FanMode;
  action?: string;
  value?: number;
  actor?: {
    username: string;
    role: string;
  };
  createdAt: Date | string;
};

export class MongoHomeRepository implements HomeRepository {
  async getHome(id: string): Promise<Home | null> {
    const doc = await HomeModel.findOne({ id }).lean<HomeRecord>().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async getAllHomes(): Promise<Home[]> {
    const docs = await HomeModel.find().lean<HomeRecord[]>().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async getDeviceById(id: string): Promise<Device | null> {
    const doc = await HomeModel.findOne({
      "rooms.devices.id": id,
    })
      .lean<HomeRecord>()
      .exec();
    if (!doc) return null;

    const home = this.toDomain(doc);
    return home.getAllDevices().find((c) => c.id === id) || null;
  }

  async saveHome(home: Home): Promise<void> {
    const record = this.toRecord(home);
    await HomeModel.findOneAndUpdate(
      { id: home.id },
      { $set: record },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    ).exec();
  }

  private toDomain(record: HomeRecord): Home {
    const rooms = (record.rooms || []).map(
      (room) =>
        new Room(
          room.id,
          room.name,
          (room.devices || []).map((device) => this.toDevice(device, room.id)),
        ),
    );

    const eventLog = (record.eventLog || []).map((event) =>
      this.toDeviceEvent(event),
    );
    return new Home(
      record.id,
      record.coordinates,
      rooms,
      record.hourlyTemperatures,
      eventLog,
    );
  }

  private toDevice(device: DeviceRecord, fallbackRoomId?: string): Device {
    const roomId = this.requireRoomId(device.roomId, fallbackRoomId, device.id);

    switch (device.type) {
      case DeviceTypes.LIGHT:
        return new Light(device.id, device.name, roomId, !!device.isOn);
      case DeviceTypes.WINDOW:
        return new Window(device.id, device.name, roomId, !!device.isOpen);
      case DeviceTypes.THERMOSTAT:
        return new Thermostat(
          device.id,
          device.name,
          roomId,
          device.temperature ?? 20,
        );
      case DeviceTypes.LOCK:
        return new SmartLock(
          device.id,
          device.name,
          roomId,
          device.isLocked ?? true,
        );
      case DeviceTypes.FAN:
        return new Fan(device.id, device.name, roomId, device.mode ?? "off");
      default:
        throw new Error(`Unsupported device type: ${device.type}`);
    }
  }

  private toRecord(home: Home): HomeRecord {
    return {
      id: home.id,
      coordinates: home.coordinates,
      rooms: home.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        devices: room.devices.map((device) =>
          this.toDeviceRecord(device, room.id),
        ),
      })),
      hourlyTemperatures: home.hourlyTemperatures,
      eventLog: home.eventLog.map((event) => this.toDeviceEventRecord(event)),
    };
  }

  private toDeviceEvent(record: DeviceEventRecord): DeviceEvent {
    const base = {
      id: record.id,
      deviceId: record.deviceId,
      deviceName: record.deviceName,
      deviceType: record.deviceType,
      actor: record.actor,
      createdAt: new Date(record.createdAt),
    };

    const eventType = this.resolveEventType(record);
    switch (eventType) {
      case "LightTurnedOn":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.LIGHT,
        };
      case "LightTurnedOff":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.LIGHT,
        };
      case "WindowOpened":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.WINDOW,
        };
      case "WindowClosed":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.WINDOW,
        };
      case "ThermostatSet":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.THERMOSTAT,
          targetTemperature: record.targetTemperature ?? record.value ?? 0,
        };
      case "FanModeSet":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.FAN,
          mode: record.mode ?? "off",
        };
      case "LockLocked":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.LOCK,
        };
      case "LockUnlocked":
        return {
          ...base,
          eventType,
          deviceType: DeviceTypes.LOCK,
        };
    }
    throw new Error(`Unsupported event type: ${eventType}`);
  }

  private toDeviceEventRecord(event: DeviceEvent): DeviceEventRecord {
    switch (event.eventType) {
      case "ThermostatSet":
        return {
          id: event.id,
          deviceId: event.deviceId,
          deviceName: event.deviceName,
          deviceType: event.deviceType,
          eventType: event.eventType,
          targetTemperature: event.targetTemperature,
          actor: event.actor,
          createdAt: event.createdAt,
        };
      case "FanModeSet":
        return {
          id: event.id,
          deviceId: event.deviceId,
          deviceName: event.deviceName,
          deviceType: event.deviceType,
          eventType: event.eventType,
          mode: event.mode,
          actor: event.actor,
          createdAt: event.createdAt,
        };
      default:
        return {
          id: event.id,
          deviceId: event.deviceId,
          deviceName: event.deviceName,
          deviceType: event.deviceType,
          eventType: event.eventType,
          actor: event.actor,
          createdAt: event.createdAt,
        };
    }
  }

  private resolveEventType(record: DeviceEventRecord): string {
    if (record.eventType) return record.eventType;
    switch (record.action) {
      case "turnOn":
        return "LightTurnedOn";
      case "turnOff":
        return "LightTurnedOff";
      case "open":
        return "WindowOpened";
      case "close":
        return "WindowClosed";
      case "setTemperature":
        return "ThermostatSet";
      case "lock":
        return "LockLocked";
      case "unlock":
        return "LockUnlocked";
      case "setMode":
        return "FanModeSet";
      default:
        throw new Error(`Unsupported event action: ${record.action}`);
    }
  }

  private toDeviceRecord(device: Device, fallbackRoomId: string): DeviceRecord {
    const roomId = this.requireRoomId(device.roomId, fallbackRoomId, device.id);
    const deviceType = device.getType();

    const record: DeviceRecord = {
      id: device.id,
      name: device.name,
      roomId,
      type: deviceType,
    };

    switch (deviceType) {
      case DeviceTypes.LIGHT:
        record.isOn = (device as Light).isOn;
        break;
      case DeviceTypes.WINDOW:
        record.isOpen = (device as Window).isOpen;
        break;
      case DeviceTypes.THERMOSTAT:
        record.temperature = (device as Thermostat).temperature;
        break;
      case DeviceTypes.LOCK:
        record.isLocked = (device as SmartLock).isLocked;
        break;
      case DeviceTypes.FAN:
        record.mode = (device as Fan).mode;
        break;
    }

    return record;
  }

  private requireRoomId(
    roomId: string | undefined,
    fallbackRoomId: string | undefined,
    deviceId: string,
  ): string {
    const resolved = roomId || fallbackRoomId;
    if (!resolved) {
      throw new Error(`Device ${deviceId} is missing roomId`);
    }
    return resolved;
  }
}
