export interface SensorReading {
  sensorId: string;
  type: string;
  value: unknown;
  measureUnit: string;
  receivedAt: number;
}
