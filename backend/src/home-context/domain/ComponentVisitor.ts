import { Fan, Light, SmartLock, Thermostat, Window } from "./Component";

export interface ComponentVisitor<T> {
  visitLight(light: Light): T;
  visitWindow(window: Window): T;
  visitThermostat(thermostat: Thermostat): T;
  visitLock(lock: SmartLock): T;
  visitFan(fan: Fan): T;
}
