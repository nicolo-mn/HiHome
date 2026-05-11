import { ComponentVisitor } from "../domain/ComponentVisitor";
import { Light } from "../domain/Light";

export type ComponentDto = {
  id: string;
  name: string;
  roomId?: string;
  type: "light";
  isOn: boolean;
};

export class ComponentStateSerializer implements ComponentVisitor<ComponentDto> {
  visitLight(light: Light): ComponentDto {
    return {
      id: light.id,
      name: light.name,
      roomId: light.roomId,
      type: "light",
      isOn: light.isOn,
    };
  }
}
