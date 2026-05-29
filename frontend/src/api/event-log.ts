import { apiFetch } from "./client";

export type DeviceEventActor = {
  username: string;
  role: string;
};

export type DeviceEventDTOBase = {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  actor?: DeviceEventActor;
  createdAt: string;
};

export type LightTurnedOnEventDTO = DeviceEventDTOBase & {
  eventType: "LightTurnedOn";
  deviceType: "light";
};

export type LightTurnedOffEventDTO = DeviceEventDTOBase & {
  eventType: "LightTurnedOff";
  deviceType: "light";
};

export type WindowOpenedEventDTO = DeviceEventDTOBase & {
  eventType: "WindowOpened";
  deviceType: "window";
};

export type WindowClosedEventDTO = DeviceEventDTOBase & {
  eventType: "WindowClosed";
  deviceType: "window";
};

export type ThermostatSetEventDTO = DeviceEventDTOBase & {
  eventType: "ThermostatSet";
  deviceType: "thermostat";
  targetTemperature: number;
};

export type LockLockedEventDTO = DeviceEventDTOBase & {
  eventType: "LockLocked";
  deviceType: "lock";
};

export type LockUnlockedEventDTO = DeviceEventDTOBase & {
  eventType: "LockUnlocked";
  deviceType: "lock";
};

export type FanMode = "off" | "low" | "medium" | "high";

export type FanModeSetEventDTO = DeviceEventDTOBase & {
  eventType: "FanModeSet";
  deviceType: "fan";
  mode: FanMode;
};

export type DeviceEventDTO =
  | LightTurnedOnEventDTO
  | LightTurnedOffEventDTO
  | WindowOpenedEventDTO
  | WindowClosedEventDTO
  | ThermostatSetEventDTO
  | LockLockedEventDTO
  | LockUnlockedEventDTO
  | FanModeSetEventDTO;

export async function getDeviceEvents(
  homeId: string,
): Promise<DeviceEventDTO[]> {
  const data = await apiFetch<{ events: DeviceEventDTO[] }>(
    `/api/home/${encodeURIComponent(homeId)}/devices/events`,
  );
  return data.events;
}
