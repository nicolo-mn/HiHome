import { Light } from "./Light";

export interface ComponentVisitor<T> {
  visitLight(light: Light): T;
}
