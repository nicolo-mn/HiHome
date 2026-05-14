import {
  ExternalSensorsUpdate,
  SensorState,
  TemperatureState,
} from "../domain";

// TODO: send sensor values on login
export interface SensorRegistry {
  getState(homeId: string): SensorState | undefined;
  setState(homeId: string, state: SensorState): void;
  setExternalSensorsUpdate(homeId: string, update: ExternalSensorsUpdate): void;
  setInternalTemperature(homeId: string, update: TemperatureState): void;
}
