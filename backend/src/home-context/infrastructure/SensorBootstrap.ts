import { SensorRegistry } from "../application/SensorRegistry";
import { InMemorySensorRegistry } from "./InMemorySensorRegistry";

export function createDefaultSensorRegistry(homeId: string): SensorRegistry {
  const registry = new InMemorySensorRegistry();
  registry.setState(homeId, {});
  return registry;
}
