import {
  Home,
  Component,
  Sensor,
  Light,
  Thermometer,
  Room,
  SensorDataPort,
  SensorUpdatePort,
  SensorUpdate,
} from "../domain";
import { HomeRepository } from "../domain/homeRepository";

export class MockSensorDataPort implements SensorDataPort {
  private temp = 22.5;
  getTemperature() {
    this.temp += Math.random() - 0.5;
    return this.temp;
  }
}

export class MockSensorUpdatePort implements SensorUpdatePort {
  public listeners: ((update: SensorUpdate) => void)[] = [];
  sendUpdate(update: SensorUpdate): void {
    this.listeners.forEach((l) => l(update));
  }
}

export const globalWsPort = new MockSensorUpdatePort();

export class InMemoryHomeRepository implements HomeRepository {
  private homes: Map<string, Home> = new Map();

  constructor() {
    this.seedDb();
  }

  private seedDb() {
    // Generate mock home as requested
    const mockHome = new Home(
      "1",
      { latitude: 45.4642, longitude: 9.19 },
      [
        new Room("room-1", "Living Room", [
          new Light("light-1", "Main Light", "room-1"),
        ]),
        new Room("room-2", "Bedroom", [
          new Light("light-2", "Bed Light", "room-2", { isOn: true }),
        ]),
      ],
      [
        new Thermometer(
          "sensor-1",
          "Indoor Thermometer",
          new MockSensorDataPort(),
          globalWsPort,
        ),
      ],
    );

    this.homes.set(mockHome.id, mockHome);
  }

  async getHome(id: string): Promise<Home | null> {
    return this.homes.get(id) || null;
  }

  async saveHome(home: Home): Promise<void> {
    this.homes.set(home.id, home);
  }
}
