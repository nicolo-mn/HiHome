import { ComponentVisitor } from "../domain/ComponentVisitor";
import { Light } from "../domain/Light";

export class ComponentStateSerializer implements ComponentVisitor<
  Record<string, unknown>
> {
  visitLight(light: Light): Record<string, unknown> {
    return { isOn: light.isOn };
  }
}
