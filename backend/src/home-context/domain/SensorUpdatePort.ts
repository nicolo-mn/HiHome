import { SensorUpdate } from "./SensorUpdate";

export interface SensorUpdatePort {
  sendUpdate(update: SensorUpdate): void;
}
