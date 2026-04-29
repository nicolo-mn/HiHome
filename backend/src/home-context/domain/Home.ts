import { Coordinates } from "./Coordinates";
import { Room } from "./Room";
import { Sensor } from "./Sensor";
import { Component } from "./Component";

export class Home {
  constructor(
    public id: string,
    public coordinates: Coordinates,
    public rooms: Room[] = [],
    public sensors: Sensor[] = [],
  ) {}

  getAllComponents(): Component[] {
    return this.rooms.flatMap((room) => room.components);
  }

  getComponentById(id: string): Component | undefined {
    return this.getAllComponents().find((c) => c.id === id);
  }

  getAllSensors(): Sensor[] {
    return this.sensors;
  }
}
