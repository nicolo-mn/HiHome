export class SensorUpdate {
  constructor(
    public sensorId: string,
    public value: any,
    public measureUnit: string,
  ) {}
}
