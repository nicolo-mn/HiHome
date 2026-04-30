export class SensorUpdate {
  constructor(
    public sensorId: string,
    public sensorType: string,
    public value: any,
    public measureUnit: string,
  ) {}
}
