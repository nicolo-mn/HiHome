import { ExternalSensorsUpdate, TemperatureState } from "../domain";

// Evaluates rules based on update sensors data
export interface RuleServicePort {
  evaluateRules(
    homeId: string,
    extSensorsData: ExternalSensorsUpdate,
    internalTemperature: TemperatureState,
  ): void;
}
