import { SensorRegistry } from "../application/SensorRegistry";
import { SensorUpdatePort, Thermometer } from "../domain";
import { InMemorySensorRegistry } from "./InMemorySensorRegistry";
import { RandomSensorDataPort } from "./RandomSensorDataPort";

export function createDefaultSensorRegistry(
  sensorUpdatePort: SensorUpdatePort,
  homeId: string,
): SensorRegistry {
  const registry = new InMemorySensorRegistry();
  // TODO: should provide the predefined set of sensors with the new implementation
  registry.setSensors(homeId, [
    new Thermometer(
      "thermometer-1",
      "Thermometer",
      new RandomSensorDataPort(),
      sensorUpdatePort,
    ),
  ]);
  return registry;
}
