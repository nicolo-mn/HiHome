import { apiFetch } from "./client";

export type ComponentEventActor = {
  username: string;
  role: string;
};

export type ComponentEventDTOBase = {
  id: string;
  componentId: string;
  componentName?: string;
  componentType: string;
  actor?: ComponentEventActor;
  createdAt: string;
};

export type LightTurnedOnEventDTO = ComponentEventDTOBase & {
  eventType: "LightTurnedOn";
  componentType: "light";
};

export type LightTurnedOffEventDTO = ComponentEventDTOBase & {
  eventType: "LightTurnedOff";
  componentType: "light";
};

export type WindowOpenedEventDTO = ComponentEventDTOBase & {
  eventType: "WindowOpened";
  componentType: "window";
};

export type WindowClosedEventDTO = ComponentEventDTOBase & {
  eventType: "WindowClosed";
  componentType: "window";
};

export type ThermostatSetEventDTO = ComponentEventDTOBase & {
  eventType: "ThermostatSet";
  componentType: "thermostat";
  targetTemperature: number;
};

export type ComponentEventDTO =
  | LightTurnedOnEventDTO
  | LightTurnedOffEventDTO
  | WindowOpenedEventDTO
  | WindowClosedEventDTO
  | ThermostatSetEventDTO;

export async function getComponentEvents(
  homeId: string,
): Promise<ComponentEventDTO[]> {
  const data = await apiFetch<{ events: ComponentEventDTO[] }>(
    `/api/home/${encodeURIComponent(homeId)}/components/events`,
  );
  return data.events;
}
