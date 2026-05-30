import { OutdoorSensorsUpdate, TemperatureState } from "../../domain";

// Evaluates rules based on update sensors data
export interface RuleServicePort {
  evaluateRules(
    homeId: string,
    extSensorsData: OutdoorSensorsUpdate,
    indoorTemperature: TemperatureState,
  ): void;
}
