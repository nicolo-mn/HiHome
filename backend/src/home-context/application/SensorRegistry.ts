import { OutdoorSensorsUpdate, SensorState, TemperatureState } from "../domain";

// TODO: send sensor values on login
export interface SensorRegistry {
  getState(homeId: string): SensorState | undefined;
  setState(homeId: string, state: SensorState): void;
  setOutdoorSensorsUpdate(homeId: string, update: OutdoorSensorsUpdate): void;
  setIndoorTemperature(homeId: string, update: TemperatureState): void;
}
