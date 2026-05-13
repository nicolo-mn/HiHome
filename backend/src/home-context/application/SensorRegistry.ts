import { Sensor } from "../domain";

export interface SensorRegistry {
  getSensors(homeId: string): Sensor[];
  setSensors(homeId: string, sensors: Sensor[]): void;
}
