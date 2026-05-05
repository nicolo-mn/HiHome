import { apiFetch } from "./client";

export type ComponentType = "light" | "window" | "thermostat" | "unknown";

// Types that have a simple boolean state (on/off, open/closed).
export type ToggleableType = "light" | "window";

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

export interface LightComponent extends ToggleableComponent {
  type: "light";
}

export interface WindowComponent extends ToggleableComponent {
  type: "window";
}

// TODO: Implement controllable thermostat component
export interface ThermostatComponent extends BaseComponent {
  type: "thermostat";
  setpoint: number;
  unit: string;
}

export type HomeComponent =
  | LightComponent
  | WindowComponent
  | ThermostatComponent
  | (BaseComponent & { type: "unknown" });

interface RawComponent {
  id: string;
  name: string;
  roomId?: string;
  isOn?: boolean;
  isOpen?: boolean;
  setpoint?: number;
  unit?: string;
  [key: string]: unknown;
}

// Infers the component type from the raw backend shape (no `type` field yet).
// Add a branch here for each new type the backend introduces.
export function inferComponentType(raw: RawComponent): ComponentType {
  if (typeof raw.isOn === "boolean") return "light";
  if (typeof raw.isOpen === "boolean") return "window";
  if (typeof raw.setpoint === "number") return "thermostat";
  return "unknown";
}

function normalizeComponent(raw: RawComponent): HomeComponent {
  const type = inferComponentType(raw);
  const base = { id: raw.id, name: raw.name, roomId: raw.roomId };
  if (type === "light") return { ...base, type, state: raw.isOn === true };
  if (type === "window") return { ...base, type, state: raw.isOpen === true };
  if (type === "thermostat") {
    return { ...base, type, setpoint: raw.setpoint!, unit: raw.unit ?? "°C" };
  }
  return { ...base, type: "unknown" };
}

export async function getComponents(homeId: string): Promise<HomeComponent[]> {
  const raw = await apiFetch<RawComponent[]>(
    `/api/home/${encodeURIComponent(homeId)}/components`,
  );
  return raw.map(normalizeComponent);
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
