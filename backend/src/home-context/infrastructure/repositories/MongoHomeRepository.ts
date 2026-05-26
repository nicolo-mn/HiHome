import {
  Component,
  ComponentTypes,
  Coordinates,
  Home,
  HomeRepository,
  Light,
  Room,
  Thermostat,
  Window,
  ComponentEvent,
} from "../../domain";
import { HomeModel } from "../models/HomeModel";

type ComponentRecord = {
  id: string;
  name: string;
  roomId: string;
  type: ComponentTypes;
  isOn?: boolean;
  isOpen?: boolean;
  temperature?: number;
};

type RoomRecord = {
  id: string;
  name: string;
  components: ComponentRecord[];
};

type HomeRecord = {
  id: string;
  coordinates: Coordinates;
  rooms: RoomRecord[];
  hourlyTemperatures?: number[];
  eventLog: ComponentEventRecord[];
};

type ComponentEventRecord = {
  id: string;
  componentId: string;
  componentName?: string;
  componentType: ComponentTypes;
  eventType?: string;
  targetTemperature?: number;
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

  async getComponentById(id: string): Promise<Component | null> {
    const doc = await HomeModel.findOne({
      "rooms.components.id": id,
    })
      .lean<HomeRecord>()
      .exec();
    if (!doc) return null;

    const home = this.toDomain(doc);
    return home.getAllComponents().find((c) => c.id === id) || null;
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
          (room.components || []).map((component) =>
            this.toComponent(component, room.id),
          ),
        ),
    );

    const eventLog = (record.eventLog || []).map((event) =>
      this.toComponentEvent(event),
    );
    return new Home(
      record.id,
      record.coordinates,
      rooms,
      record.hourlyTemperatures,
      eventLog,
    );
  }

  private toComponent(
    component: ComponentRecord,
    fallbackRoomId?: string,
  ): Component {
    const roomId = this.requireRoomId(
      component.roomId,
      fallbackRoomId,
      component.id,
    );

    switch (component.type) {
      case ComponentTypes.LIGHT:
        return new Light(
          component.id,
          component.name,
          roomId,
          !!component.isOn,
        );
      case ComponentTypes.WINDOW:
        return new Window(
          component.id,
          component.name,
          roomId,
          !!component.isOpen,
        );
      case ComponentTypes.THERMOSTAT:
        return new Thermostat(
          component.id,
          component.name,
          roomId,
          component.temperature ?? 20,
        );
      default:
        throw new Error(`Unsupported component type: ${component.type}`);
    }
  }

  private toRecord(home: Home): HomeRecord {
    return {
      id: home.id,
      coordinates: home.coordinates,
      rooms: home.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        components: room.components.map((component) =>
          this.toComponentRecord(component, room.id),
        ),
      })),
      hourlyTemperatures: home.hourlyTemperatures,
      eventLog: home.eventLog.map((event) =>
        this.toComponentEventRecord(event),
      ),
    };
  }

  private toComponentEvent(record: ComponentEventRecord): ComponentEvent {
    const base = {
      id: record.id,
      componentId: record.componentId,
      componentName: record.componentName,
      componentType: record.componentType,
      actor: record.actor,
      createdAt: new Date(record.createdAt),
    };

    const eventType = this.resolveEventType(record);
    switch (eventType) {
      case "LightTurnedOn":
        return {
          ...base,
          eventType,
          componentType: ComponentTypes.LIGHT,
        };
      case "LightTurnedOff":
        return {
          ...base,
          eventType,
          componentType: ComponentTypes.LIGHT,
        };
      case "WindowOpened":
        return {
          ...base,
          eventType,
          componentType: ComponentTypes.WINDOW,
        };
      case "WindowClosed":
        return {
          ...base,
          eventType,
          componentType: ComponentTypes.WINDOW,
        };
      case "ThermostatSet":
        return {
          ...base,
          eventType,
          componentType: ComponentTypes.THERMOSTAT,
          targetTemperature: record.targetTemperature ?? record.value ?? 0,
        };
      default:
        return {
          ...base,
          eventType: "LightTurnedOn",
          componentType: ComponentTypes.LIGHT,
        };
    }
  }

  private toComponentEventRecord(event: ComponentEvent): ComponentEventRecord {
    switch (event.eventType) {
      case "ThermostatSet":
        return {
          id: event.id,
          componentId: event.componentId,
          componentName: event.componentName,
          componentType: event.componentType,
          eventType: event.eventType,
          targetTemperature: event.targetTemperature,
          actor: event.actor,
          createdAt: event.createdAt,
        };
      default:
        return {
          id: event.id,
          componentId: event.componentId,
          componentName: event.componentName,
          componentType: event.componentType,
          eventType: event.eventType,
          actor: event.actor,
          createdAt: event.createdAt,
        };
    }
  }

  private resolveEventType(record: ComponentEventRecord): string {
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
      default:
        return "LightTurnedOn";
    }
  }

  private toComponentRecord(
    component: Component,
    fallbackRoomId: string,
  ): ComponentRecord {
    const roomId = this.requireRoomId(
      component.roomId,
      fallbackRoomId,
      component.id,
    );
    const componentType = component.getType();

    const record: ComponentRecord = {
      id: component.id,
      name: component.name,
      roomId,
      type: componentType,
    };

    switch (componentType) {
      case ComponentTypes.LIGHT:
        record.isOn = (component as Light).isOn;
        break;
      case ComponentTypes.WINDOW:
        record.isOpen = (component as Window).isOpen;
        break;
      case ComponentTypes.THERMOSTAT:
        record.temperature = (component as Thermostat).temperature;
        break;
    }

    return record;
  }

  private requireRoomId(
    roomId: string | undefined,
    fallbackRoomId: string | undefined,
    componentId: string,
  ): string {
    const resolved = roomId || fallbackRoomId;
    if (!resolved) {
      throw new Error(`Component ${componentId} is missing roomId`);
    }
    return resolved;
  }
}
