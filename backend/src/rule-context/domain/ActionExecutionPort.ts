import {
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
  LightTurnOnAction,
  LightTurnOffAction,
} from "./Actions";

export interface ActionExecutionPort {
  executeWindowOpen(action: WindowOpenAction): Promise<void>;
  executeWindowClose(action: WindowCloseAction): Promise<void>;
  executeThermostatSetTemperature(
    action: ThermostatSetTemperatureAction,
  ): Promise<void>;
  executeLightTurnOn(action: LightTurnOnAction): Promise<void>;
  executeLightTurnOff(action: LightTurnOffAction): Promise<void>;
}
