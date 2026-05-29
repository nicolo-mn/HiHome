import { randomUUID } from "crypto";
import { DeviceVisitor } from "./DeviceVisitor";
import {
  DeviceEventActor,
  DeviceEventBase,
  FanMode,
  FanModeSetEvent,
  LightTurnedOffEvent,
  LightTurnedOnEvent,
  LockLockedEvent,
  LockUnlockedEvent,
  ThermostatSetEvent,
  WindowClosedEvent,
  WindowOpenedEvent,
} from "./EventLog";

export enum DeviceTypes {
  LIGHT = "light",
  WINDOW = "window",
  THERMOSTAT = "thermostat",
  LOCK = "lock",
  FAN = "fan",
}

export function createDevice(
  id: string,
  input: { name: string; type: DeviceTypes; roomId: string },
): Device {
  switch (input.type) {
    case DeviceTypes.LIGHT:
      return new Light(id, input.name, input.roomId);
    case DeviceTypes.WINDOW:
      return new Window(id, input.name, input.roomId);
    case DeviceTypes.THERMOSTAT:
      return new Thermostat(id, input.name, input.roomId);
    case DeviceTypes.LOCK:
      return new SmartLock(id, input.name, input.roomId);
    case DeviceTypes.FAN:
      return new Fan(id, input.name, input.roomId);
    default:
      throw new Error("Unsupported device type");
  }
}

export interface Device {
  id: string;
  name: string;
  roomId?: string;
  getType(): DeviceTypes;
  accept<T>(visitor: DeviceVisitor<T>): T;
}

function buildEventBase(
  device: Device,
  actor?: DeviceEventActor,
): DeviceEventBase {
  return {
    id: randomUUID(),
    deviceId: device.id,
    deviceName: device.name,
    deviceType: device.getType(),
    actor,
    createdAt: new Date(),
  };
}

export class Light implements Device {
  private type: DeviceTypes = DeviceTypes.LIGHT;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isOn: boolean = false,
  ) {}

  getType(): DeviceTypes {
    return this.type;
  }

  accept<T>(visitor: DeviceVisitor<T>): T {
    return visitor.visitLight(this);
  }

  turnOn(actor?: DeviceEventActor): LightTurnedOnEvent {
    this.isOn = true;
    return {
      ...buildEventBase(this, actor),
      eventType: "LightTurnedOn",
      deviceType: DeviceTypes.LIGHT,
    };
  }

  turnOff(actor?: DeviceEventActor): LightTurnedOffEvent {
    this.isOn = false;
    return {
      ...buildEventBase(this, actor),
      eventType: "LightTurnedOff",
      deviceType: DeviceTypes.LIGHT,
    };
  }
}

export class Window implements Device {
  private type: DeviceTypes = DeviceTypes.WINDOW;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isOpen: boolean = false,
  ) {}

  getType(): DeviceTypes {
    return this.type;
  }

  accept<T>(visitor: DeviceVisitor<T>): T {
    return visitor.visitWindow(this);
  }

  open(actor?: DeviceEventActor): WindowOpenedEvent {
    this.isOpen = true;
    return {
      ...buildEventBase(this, actor),
      eventType: "WindowOpened",
      deviceType: DeviceTypes.WINDOW,
    };
  }

  close(actor?: DeviceEventActor): WindowClosedEvent {
    this.isOpen = false;
    return {
      ...buildEventBase(this, actor),
      eventType: "WindowClosed",
      deviceType: DeviceTypes.WINDOW,
    };
  }
}

export class Thermostat implements Device {
  private type: DeviceTypes = DeviceTypes.THERMOSTAT;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public temperature: number = 20,
  ) {}

  getType(): DeviceTypes {
    return this.type;
  }

  accept<T>(visitor: DeviceVisitor<T>): T {
    return visitor.visitThermostat(this);
  }

  setTemperature(temp: number, actor?: DeviceEventActor): ThermostatSetEvent {
    this.temperature = temp;
    return {
      ...buildEventBase(this, actor),
      eventType: "ThermostatSet",
      deviceType: DeviceTypes.THERMOSTAT,
      targetTemperature: temp,
    };
  }
}

export class SmartLock implements Device {
  private type: DeviceTypes = DeviceTypes.LOCK;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isLocked: boolean = true,
  ) {}

  getType(): DeviceTypes {
    return this.type;
  }

  accept<T>(visitor: DeviceVisitor<T>): T {
    return visitor.visitLock(this);
  }

  lock(actor?: DeviceEventActor): LockLockedEvent {
    this.isLocked = true;
    return {
      ...buildEventBase(this, actor),
      eventType: "LockLocked",
      deviceType: DeviceTypes.LOCK,
    };
  }

  unlock(actor?: DeviceEventActor): LockUnlockedEvent {
    this.isLocked = false;
    return {
      ...buildEventBase(this, actor),
      eventType: "LockUnlocked",
      deviceType: DeviceTypes.LOCK,
    };
  }
}

export class Fan implements Device {
  private type: DeviceTypes = DeviceTypes.FAN;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public mode: FanMode = "off",
  ) {}

  getType(): DeviceTypes {
    return this.type;
  }

  accept<T>(visitor: DeviceVisitor<T>): T {
    return visitor.visitFan(this);
  }

  setMode(mode: FanMode, actor?: DeviceEventActor): FanModeSetEvent {
    this.mode = mode;
    return {
      ...buildEventBase(this, actor),
      eventType: "FanModeSet",
      deviceType: DeviceTypes.FAN,
      mode,
    };
  }
}
