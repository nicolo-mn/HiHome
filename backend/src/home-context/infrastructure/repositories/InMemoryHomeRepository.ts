import { Home, Light, Room, SensorUpdatePort, Component } from "../../domain";
import { HomeRepository } from "../../domain/HomeRepository";

export class InMemoryHomeRepository implements HomeRepository {
  private homes: Map<string, Home> = new Map();

  constructor() {
    this.seedDb();
  }

  private seedDb() {
    const mockHome = new Home("1", { latitude: 45.4642, longitude: 9.19 }, [
      new Room("room-1", "Living Room", [
        new Light("light-1", "Main Light", "room-1"),
      ]),
      new Room("room-2", "Bedroom", [
        new Light("light-2", "Bed Light", "room-2", true),
      ]),
    ]);

    this.homes.set(mockHome.id, mockHome);
  }

  async getHome(id: string): Promise<Home | null> {
    return this.homes.get(id) || null;
  }

  async getAllHomes(): Promise<Home[]> {
    return Array.from(this.homes.values());
  }

  async getComponentById(id: string): Promise<Component | null> {
    // Convert map values to an array and search through them
    for (const home of this.homes.values()) {
      const component = home.getAllComponents().find((c) => c.id === id);
      if (component) {
        return component;
      }
    }
    return null;
  }

  async saveHome(home: Home): Promise<void> {
    this.homes.set(home.id, home);
  }
}
