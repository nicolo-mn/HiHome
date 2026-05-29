import { apiFetch } from "./client";

export type DeviceType =
  | "light"
  | "window"
  | "thermostat"
  | "lock"
  | "fan"
  | "unknown";

// Types that have a simple boolean state (on/off, open/closed, locked/unlocked).
export type ToggleableType = "light" | "window" | "lock";

// Types the user can create from the add-device form.
export type CreatableType = ToggleableType | "fan";

export type FanMode = "off" | "low" | "medium" | "high";

export const FAN_MODES: FanMode[] = ["off", "low", "medium", "high"];

export type CreateDeviceInput = {
  name: string;
  type: CreatableType;
  roomId: string;
};

export interface BaseDevice {
  id: string;
  name: string;
  roomId?: string;
  roomName?: string;
}

// Shared interface for devices whose state is a single boolean.
// `state` is normalized from backend field names (isOn, isOpen, …).
export interface ToggleableDevice extends BaseDevice {
  type: ToggleableType;
  state: boolean;
}

// TODO: Implement controllable thermostat device
export interface ThermostatDevice extends BaseDevice {
  type: "thermostat";
  setpoint: number;
  unit: string;
}

export interface FanDevice extends BaseDevice {
  type: "fan";
  mode: FanMode;
}

export type HomeDevice =
  | ToggleableDevice
  | ThermostatDevice
  | FanDevice
  | (BaseDevice & { type: "unknown" });

export interface RawDevice {
  id: string;
  name: string;
  roomId?: string;
  roomName?: string;
  type: string;
  isOn?: boolean;
  isOpen?: boolean;
  isLocked?: boolean;
  temperature?: number;
  unit?: string;
  mode?: FanMode;
}
export function normalizeDevice(raw: RawDevice): HomeDevice {
  const base = {
    id: raw.id,
    name: raw.name,
    roomId: raw.roomId,
    roomName: raw.roomName,
    type: raw.type,
  };

  switch (raw.type) {
    case "light":
      return { ...base, type: "light", state: raw.isOn === true };
    case "window":
      return { ...base, type: "window", state: raw.isOpen === true };
    case "lock":
      return { ...base, type: "lock", state: raw.isLocked === true };
    case "thermostat":
      return {
        ...base,
        type: "thermostat",
        setpoint: raw.temperature ?? 0,
        unit: raw.unit ?? "°C",
      };
    case "fan":
      return { ...base, type: "fan", mode: raw.mode ?? "off" };
    default:
      return { ...base, type: "unknown" };
  }
}

export async function getDevices(homeId: string): Promise<HomeDevice[]> {
  const raw = await apiFetch<RawDevice[]>(
    `/api/home/${encodeURIComponent(homeId)}/devices`,
  );
  return raw.map(normalizeDevice);
}

export async function createDevice(
  homeId: string,
  input: CreateDeviceInput,
): Promise<HomeDevice> {
  const raw = await apiFetch<RawDevice>(
    `/api/home/${encodeURIComponent(homeId)}/devices`,
    { method: "POST", body: input },
  );
  return normalizeDevice(raw);
}

export async function executeAction(
  homeId: string,
  deviceId: string,
  action: string,
  body?: unknown,
): Promise<HomeDevice> {
  const raw = await apiFetch<RawDevice>(
    `/api/home/${encodeURIComponent(homeId)}/devices/${encodeURIComponent(deviceId)}/${encodeURIComponent(action)}`,
    { method: "POST", body },
  );
  return normalizeDevice(raw);
}

const TOGGLE_ACTIONS: Record<ToggleableType, { on: string; off: string }> = {
  light: { on: "turnOn", off: "turnOff" },
  window: { on: "open", off: "close" },
  lock: { on: "lock", off: "unlock" },
};

export function toggle(
  homeId: string,
  c: ToggleableDevice,
  next: boolean,
): Promise<HomeDevice> {
  const action = TOGGLE_ACTIONS[c.type][next ? "on" : "off"];
  return executeAction(homeId, c.id, action);
}

export function setFanMode(
  homeId: string,
  c: FanDevice,
  mode: FanMode,
): Promise<HomeDevice> {
  return executeAction(homeId, c.id, "setMode", { mode });
}

export function setpointDelta(
  homeId: string,
  c: ThermostatDevice,
  dir: "up" | "down",
): Promise<HomeDevice> {
  const rawNext = dir === "up" ? c.setpoint + 0.5 : c.setpoint - 0.5;
  const next = Math.max(5, Math.min(40, rawNext));
  if (next === c.setpoint) {
    return Promise.resolve(c);
  }
  return executeAction(homeId, c.id, "setTemperature", { temperature: next });
}
