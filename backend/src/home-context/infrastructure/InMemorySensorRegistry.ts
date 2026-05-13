import { Sensor } from "../domain";
import { SensorRegistry } from "../application/SensorRegistry";

export class InMemorySensorRegistry implements SensorRegistry {
  private sensorsByHome = new Map<string, Sensor[]>();

  getSensors(homeId: string): Sensor[] {
    return this.sensorsByHome.get(homeId) || [];
  }

  setSensors(homeId: string, sensors: Sensor[]): void {
    this.sensorsByHome.set(homeId, sensors);
  }
}
