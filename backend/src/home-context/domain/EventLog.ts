import { ComponentTypes } from "./Component";

export type ComponentEventActor = {
  username: string;
  role: string;
};

export type ComponentEventBase = {
  id: string;
  componentId: string;
  componentName?: string;
  componentType: ComponentTypes;
  actor?: ComponentEventActor;
  createdAt: Date;
};

export type LightTurnedOnEvent = ComponentEventBase & {
  eventType: "LightTurnedOn";
  componentType: ComponentTypes.LIGHT;
};

export type LightTurnedOffEvent = ComponentEventBase & {
  eventType: "LightTurnedOff";
  componentType: ComponentTypes.LIGHT;
};

export type WindowOpenedEvent = ComponentEventBase & {
  eventType: "WindowOpened";
  componentType: ComponentTypes.WINDOW;
};

export type WindowClosedEvent = ComponentEventBase & {
  eventType: "WindowClosed";
  componentType: ComponentTypes.WINDOW;
};

export type ThermostatSetEvent = ComponentEventBase & {
  eventType: "ThermostatSet";
  componentType: ComponentTypes.THERMOSTAT;
  targetTemperature: number;
};

export type ComponentEvent =
  | LightTurnedOnEvent
  | LightTurnedOffEvent
  | WindowOpenedEvent
  | WindowClosedEvent
  | ThermostatSetEvent;
