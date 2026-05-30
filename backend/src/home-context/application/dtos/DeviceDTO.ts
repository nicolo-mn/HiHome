import { DeviceTypes, FanMode } from "../../domain";

export type CreateDeviceInput = {
  name: string;
  type: DeviceTypes;
  roomId: string;
};

export type DeviceSerialization =
  | LightDTO
  | WindowDTO
  | ThermostatDTO
  | SmartLockDTO
  | FanDTO;

export type DeviceDTO = {
  id: string;
  name: string;
  roomId?: string;
  roomName?: string;
};

export type LightDTO = DeviceDTO & {
  type: DeviceTypes;
  isOn: boolean;
};

export type WindowDTO = DeviceDTO & {
  type: DeviceTypes;
  isOpen: boolean;
};

export type ThermostatDTO = DeviceDTO & {
  type: DeviceTypes;
  temperature: number;
};

export type SmartLockDTO = DeviceDTO & {
  type: DeviceTypes;
  isLocked: boolean;
};

export type FanDTO = DeviceDTO & {
  type: DeviceTypes;
  mode: FanMode;
};
