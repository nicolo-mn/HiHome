import { ComponentTypes } from "../../domain";

export type CreateComponentInput = {
  name: string;
  type: ComponentTypes;
  roomId: string;
};

export type ComponentSerialization = LightDTO | WindowDTO | ThermostatDTO;

export type ComponentDTO = {
  id: string;
  name: string;
  roomId?: string;
};

export type LightDTO = ComponentDTO & {
  type: ComponentTypes;
  isOn: boolean;
};

export type WindowDTO = ComponentDTO & {
  type: ComponentTypes;
  isOpen: boolean;
};

export type ThermostatDTO = ComponentDTO & {
  type: ComponentTypes;
  temperature: number;
};
