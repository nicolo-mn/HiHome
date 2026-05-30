import { DeviceTypes } from "./Device";

export type DeviceEventActor = {
  username: string;
  role: string;
};

export type DeviceEventBase = {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType: DeviceTypes;
  actor?: DeviceEventActor;
  createdAt: Date;
};

export type LightTurnedOnEvent = DeviceEventBase & {
  eventType: "LightTurnedOn";
  deviceType: DeviceTypes.LIGHT;
};

export type LightTurnedOffEvent = DeviceEventBase & {
  eventType: "LightTurnedOff";
  deviceType: DeviceTypes.LIGHT;
};

export type WindowOpenedEvent = DeviceEventBase & {
  eventType: "WindowOpened";
  deviceType: DeviceTypes.WINDOW;
};

export type WindowClosedEvent = DeviceEventBase & {
  eventType: "WindowClosed";
  deviceType: DeviceTypes.WINDOW;
};

export type ThermostatSetEvent = DeviceEventBase & {
  eventType: "ThermostatSet";
  deviceType: DeviceTypes.THERMOSTAT;
  targetTemperature: number;
};

export type LockLockedEvent = DeviceEventBase & {
  eventType: "LockLocked";
  deviceType: DeviceTypes.LOCK;
};

export type LockUnlockedEvent = DeviceEventBase & {
  eventType: "LockUnlocked";
  deviceType: DeviceTypes.LOCK;
};

export type FanMode = "off" | "low" | "medium" | "high";

export type FanModeSetEvent = DeviceEventBase & {
  eventType: "FanModeSet";
  deviceType: DeviceTypes.FAN;
  mode: FanMode;
};

export type DeviceEvent =
  | LightTurnedOnEvent
  | LightTurnedOffEvent
  | WindowOpenedEvent
  | WindowClosedEvent
  | ThermostatSetEvent
  | LockLockedEvent
  | LockUnlockedEvent
  | FanModeSetEvent;
