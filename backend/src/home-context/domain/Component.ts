import { randomUUID } from "crypto";
import { ComponentVisitor } from "./ComponentVisitor";
import {
  ComponentEventActor,
  ComponentEventBase,
  LightTurnedOffEvent,
  LightTurnedOnEvent,
  LockLockedEvent,
  LockUnlockedEvent,
  ThermostatSetEvent,
  WindowClosedEvent,
  WindowOpenedEvent,
} from "./EventLog";

export enum ComponentTypes {
  LIGHT = "light",
  WINDOW = "window",
  THERMOSTAT = "thermostat",
  LOCK = "lock",
}

export function createComponent(
  id: string,
  input: { name: string; type: ComponentTypes; roomId: string },
): Component {
  switch (input.type) {
    case ComponentTypes.LIGHT:
      return new Light(id, input.name, input.roomId);
    case ComponentTypes.WINDOW:
      return new Window(id, input.name, input.roomId);
    case ComponentTypes.THERMOSTAT:
      return new Thermostat(id, input.name, input.roomId);
    case ComponentTypes.LOCK:
      return new SmartLock(id, input.name, input.roomId);
    default:
      throw new Error("Unsupported component type");
  }
}

export interface Component {
  id: string;
  name: string;
  roomId?: string;
  getType(): ComponentTypes;
  accept<T>(visitor: ComponentVisitor<T>): T;
}

function buildEventBase(
  component: Component,
  actor?: ComponentEventActor,
): ComponentEventBase {
  return {
    id: randomUUID(),
    componentId: component.id,
    componentName: component.name,
    componentType: component.getType(),
    actor,
    createdAt: new Date(),
  };
}

export class Light implements Component {
  private type: ComponentTypes = ComponentTypes.LIGHT;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isOn: boolean = false,
  ) {}

  getType(): ComponentTypes {
    return this.type;
  }

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitLight(this);
  }

  turnOn(actor?: ComponentEventActor): LightTurnedOnEvent {
    this.isOn = true;
    return {
      ...buildEventBase(this, actor),
      eventType: "LightTurnedOn",
      componentType: ComponentTypes.LIGHT,
    };
  }

  turnOff(actor?: ComponentEventActor): LightTurnedOffEvent {
    this.isOn = false;
    return {
      ...buildEventBase(this, actor),
      eventType: "LightTurnedOff",
      componentType: ComponentTypes.LIGHT,
    };
  }
}

export class Window implements Component {
  private type: ComponentTypes = ComponentTypes.WINDOW;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isOpen: boolean = false,
  ) {}

  getType(): ComponentTypes {
    return this.type;
  }

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitWindow(this);
  }

  open(actor?: ComponentEventActor): WindowOpenedEvent {
    this.isOpen = true;
    return {
      ...buildEventBase(this, actor),
      eventType: "WindowOpened",
      componentType: ComponentTypes.WINDOW,
    };
  }

  close(actor?: ComponentEventActor): WindowClosedEvent {
    this.isOpen = false;
    return {
      ...buildEventBase(this, actor),
      eventType: "WindowClosed",
      componentType: ComponentTypes.WINDOW,
    };
  }
}

export class Thermostat implements Component {
  private type: ComponentTypes = ComponentTypes.THERMOSTAT;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public temperature: number = 20,
  ) {}

  getType(): ComponentTypes {
    return this.type;
  }

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitThermostat(this);
  }

  setTemperature(
    temp: number,
    actor?: ComponentEventActor,
  ): ThermostatSetEvent {
    this.temperature = temp;
    return {
      ...buildEventBase(this, actor),
      eventType: "ThermostatSet",
      componentType: ComponentTypes.THERMOSTAT,
      targetTemperature: temp,
    };
  }
}

export class SmartLock implements Component {
  private type: ComponentTypes = ComponentTypes.LOCK;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isLocked: boolean = true,
  ) {}

  getType(): ComponentTypes {
    return this.type;
  }

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitLock(this);
  }

  lock(actor?: ComponentEventActor): LockLockedEvent {
    this.isLocked = true;
    return {
      ...buildEventBase(this, actor),
      eventType: "LockLocked",
      componentType: ComponentTypes.LOCK,
    };
  }

  unlock(actor?: ComponentEventActor): LockUnlockedEvent {
    this.isLocked = false;
    return {
      ...buildEventBase(this, actor),
      eventType: "LockUnlocked",
      componentType: ComponentTypes.LOCK,
    };
  }
}
