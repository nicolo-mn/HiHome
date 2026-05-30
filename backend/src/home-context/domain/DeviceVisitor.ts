import { Fan, Light, SmartLock, Thermostat, Window } from "./Device";

export interface DeviceVisitor<T> {
  visitLight(light: Light): T;
  visitWindow(window: Window): T;
  visitThermostat(thermostat: Thermostat): T;
  visitLock(lock: SmartLock): T;
  visitFan(fan: Fan): T;
}
