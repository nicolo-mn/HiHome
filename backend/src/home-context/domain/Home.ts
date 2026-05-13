import { Coordinates } from "./Coordinates";
import { Room } from "./Room";
import { Component, ComponentTypes } from "./Component";

export class Home {
  constructor(
    public id: string,
    public coordinates: Coordinates,
    public rooms: Room[] = [],
  ) {}

  getAllComponents(): Component[] {
    return this.rooms.flatMap((room) => room.components);
  }

  getComponentById(componentId: string): Component | undefined {
    return this.getAllComponents().find((c) => c.id === componentId);
  }

  getComponentByIdAndType(
    componentId: string,
    type: ComponentTypes,
  ): Component | undefined {
    return this.getAllComponents().find(
      (c) => c.id === componentId && c.getType() === type,
    );
  }
}
