export interface Sensor {
  id: string;
  name: string;
  sendUpdate(): void;
}
