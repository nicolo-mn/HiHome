import { apiFetch } from "./client";

export type ComponentType = "light" | "window" | "thermostat" | "unknown";

// Types that have a simple boolean state (on/off, open/closed).
export type ToggleableType = "light" | "window";

export type CreateComponentInput = {
  name: string;
  type: ToggleableType;
  roomId: string;
};

export interface BaseComponent {
  id: string;
  name: string;
  roomId?: string;
}

// Shared interface for components whose state is a single boolean.
// `state` is normalized from backend field names (isOn, isOpen, …).
export interface ToggleableComponent extends BaseComponent {
  type: ToggleableType;
  state: boolean;
}

// TODO: Implement controllable thermostat component
export interface ThermostatComponent extends BaseComponent {
  type: "thermostat";
  setpoint: number;
  unit: string;
}

export type HomeComponent =
  | ToggleableComponent
  | ThermostatComponent
  | (BaseComponent & { type: "unknown" });

interface RawComponent {
  id: string;
  name: string;
  roomId?: string;
  type: string;
  isOn?: boolean;
  isOpen?: boolean;
  temperature?: number;
  unit?: string;
}
function normalizeComponent(raw: RawComponent): HomeComponent {
  const base = {
    id: raw.id,
    name: raw.name,
    roomId: raw.roomId,
    type: raw.type,
  };

  switch (raw.type) {
    case "light":
      return { ...base, type: "light", state: raw.isOn === true };
    case "window":
      return { ...base, type: "window", state: raw.isOpen === true };
    case "thermostat":
      return {
        ...base,
        type: "thermostat",
        setpoint: raw.temperature ?? 0,
        unit: raw.unit ?? "°C",
      };
    default:
      return { ...base, type: "unknown" };
  }
}

export async function getComponents(homeId: string): Promise<HomeComponent[]> {
  const raw = await apiFetch<RawComponent[]>(
    `/api/home/${encodeURIComponent(homeId)}/components`,
  );
  return raw.map(normalizeComponent);
}

export async function createComponent(
  homeId: string,
  input: CreateComponentInput,
): Promise<HomeComponent> {
  const raw = await apiFetch<RawComponent>(
    `/api/home/${encodeURIComponent(homeId)}/components`,
    { method: "POST", body: input },
  );
  return normalizeComponent(raw);
}

export async function executeAction(
  homeId: string,
  componentId: string,
  action: string,
  body?: unknown,
): Promise<HomeComponent> {
  const raw = await apiFetch<RawComponent>(
    `/api/home/${encodeURIComponent(homeId)}/components/${encodeURIComponent(componentId)}/${encodeURIComponent(action)}`,
    { method: "POST", body },
  );
  return normalizeComponent(raw);
}

export async function getComponentTypes(homeId: string): Promise<string[]> {
  return apiFetch<string[]>(
    `/api/home/${encodeURIComponent(homeId)}/components/types`,
  );
}

const TOGGLE_ACTIONS: Record<ToggleableType, { on: string; off: string }> = {
  light: { on: "turnOn", off: "turnOff" },
  window: { on: "open", off: "close" },
};

export function toggle(
  homeId: string,
  c: ToggleableComponent,
  next: boolean,
): Promise<HomeComponent> {
  const action = TOGGLE_ACTIONS[c.type][next ? "on" : "off"];
  return executeAction(homeId, c.id, action);
}

export function setpointDelta(
  homeId: string,
  c: ThermostatComponent,
  dir: "up" | "down",
): Promise<HomeComponent> {
  const rawNext = dir === "up" ? c.setpoint + 0.5 : c.setpoint - 0.5;
  const next = Math.max(5, Math.min(40, rawNext));
  if (next === c.setpoint) {
    return Promise.resolve(c);
  }
  return executeAction(homeId, c.id, "setTemperature", { temperature: next });
}
