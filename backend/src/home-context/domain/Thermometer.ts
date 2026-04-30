import { Sensor } from "./Sensor";
import { SensorDataPort } from "./SensorDataPort";
import { SensorUpdatePort } from "./SensorUpdatePort";
import { SensorUpdate } from "./SensorUpdate";

export class Thermometer implements Sensor {
  constructor(
    public id: string,
    public name: string,
    private dataPort: SensorDataPort,
    private updatePort: SensorUpdatePort,
  ) {}

  sendUpdate(): void {
    const temp = this.dataPort.getTemperature();
    this.updatePort.sendUpdate(
      new SensorUpdate(
        this.id,
        "thermometer",
        { temperature: temp },
        "Celsius",
      ),
    );
  }
}
