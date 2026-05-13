import { SensorDataPort } from "../domain";

export class RandomSensorDataPort implements SensorDataPort {
  private temp = 22.5;

  getTemperature(): number {
    this.temp += Math.random() - 0.5;
    return this.temp;
  }
}
