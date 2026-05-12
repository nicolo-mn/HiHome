import { Light, Thermostat, Window } from "./Component";

export interface ComponentVisitor<T> {
  visitLight(light: Light): T;
  visitWindow(window: Window): T;
  visitThermostat(thermostat: Thermostat): T;
}
