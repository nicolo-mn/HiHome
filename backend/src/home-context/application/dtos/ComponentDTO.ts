import { ComponentTypes, FanMode } from "../../domain";

export type CreateComponentInput = {
  name: string;
  type: ComponentTypes;
  roomId: string;
};

export type ComponentSerialization =
  | LightDTO
  | WindowDTO
  | ThermostatDTO
  | SmartLockDTO
  | FanDTO;

export type ComponentDTO = {
  id: string;
  name: string;
  roomId?: string;
  roomName?: string;
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

export type SmartLockDTO = ComponentDTO & {
  type: ComponentTypes;
  isLocked: boolean;
};

export type FanDTO = ComponentDTO & {
  type: ComponentTypes;
  mode: FanMode;
};
