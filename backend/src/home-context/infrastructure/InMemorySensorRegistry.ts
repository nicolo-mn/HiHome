import {
  ExternalSensorsUpdate,
  SensorState,
  TemperatureState,
} from "../domain";
import { SensorRegistry } from "../application/SensorRegistry";

export class InMemorySensorRegistry implements SensorRegistry {
  private sensorsByHome = new Map<string, SensorState>();

  constructor() {
    // Initialize with some dummy data for testing, in a real environment
    // this would be empty and populated by actual sensor updates
    this.setIndoorTemperature("1", { temperature: 22 });
  }

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

  setIndoorTemperature(homeId: string, update: TemperatureState): void {
    const prev = this.sensorsByHome.get(homeId) || {};
    this.sensorsByHome.set(homeId, { ...prev, indoorTemperature: update });
  }
}
