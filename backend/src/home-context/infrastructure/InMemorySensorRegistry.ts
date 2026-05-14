import {
  ExternalSensorsUpdate,
  SensorState,
  TemperatureState,
} from "../domain";
import { SensorRegistry } from "../application/SensorRegistry";

export class InMemorySensorRegistry implements SensorRegistry {
  private sensorsByHome = new Map<string, SensorState>();

  getState(homeId: string): SensorState | undefined {
    return this.sensorsByHome.get(homeId);
  }

  setState(homeId: string, state: SensorState): void {
    this.sensorsByHome.set(homeId, state);
  }

  setExternalSensorsUpdate(
    homeId: string,
    update: ExternalSensorsUpdate,
  ): void {
    const prev = this.sensorsByHome.get(homeId) || {};
    this.sensorsByHome.set(homeId, { ...prev, externalSensors: update });
  }

  setInternalTemperature(homeId: string, update: TemperatureState): void {
    const prev = this.sensorsByHome.get(homeId) || {};
    this.sensorsByHome.set(homeId, { ...prev, internalTemperature: update });
  }
}
