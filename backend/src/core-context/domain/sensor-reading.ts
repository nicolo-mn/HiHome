export type SensorType = "weather" | "temperature" | "air_quality";

export class SensorReading {
  public readonly timestamp: Date;

  constructor(
    public readonly type: SensorType,
    public readonly value: number | string,
    public readonly unit: string,
  ) {
    this.timestamp = new Date();
  }
}
