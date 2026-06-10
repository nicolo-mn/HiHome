import {
  NumericOperator,
  NumericGreaterOperator,
  NumericLowerOperator,
  NumericEqualityOperator,
  OutdoorTemperatureCondition,
  IndoorTemperatureCondition,
  AirQualityCondition,
  WindSpeedCondition,
  WeatherCondition,
  ConditionVisitor,
} from "../../domain/Observables";

export const WEATHER_TYPE = "weather";
export const OUTDOOR_TEMP_TYPE = "outdoor-thermometer";
export const INDOOR_TEMP_TYPE = "indoor-thermometer";
export const AIR_QUALITY_TYPE = "air-quality";
export const WIND_SPEED_TYPE = "wind-speed";

export const OP_EQ = "eq";
export const OP_GT = "gt";
export const OP_LT = "lt";

export type ConditionRecord = {
  type: string;
  operator: string;
  target: string | number;
};

export class ConditionRecordVisitor implements ConditionVisitor<ConditionRecord> {
  visitWeatherCondition(cond: WeatherCondition): ConditionRecord {
    return {
      type: WEATHER_TYPE,
      operator: OP_EQ,
      target: cond.operator.getBoundaryValue(),
    };
  }

  visitOutdoorTemperatureCondition(
    cond: OutdoorTemperatureCondition,
  ): ConditionRecord {
    return this.numericRecord(OUTDOOR_TEMP_TYPE, cond.operator);
  }

  visitIndoorTemperatureCondition(
    cond: IndoorTemperatureCondition,
  ): ConditionRecord {
    return this.numericRecord(INDOOR_TEMP_TYPE, cond.operator);
  }

  visitAirQualityCondition(cond: AirQualityCondition): ConditionRecord {
    return this.numericRecord(AIR_QUALITY_TYPE, cond.operator);
  }

  visitWindSpeedCondition(cond: WindSpeedCondition): ConditionRecord {
    return this.numericRecord(WIND_SPEED_TYPE, cond.operator);
  }

  private numericRecord(
    type: string,
    operator: NumericOperator,
  ): ConditionRecord {
    const target = operator.getBoundaryValue();

    if (operator instanceof NumericGreaterOperator) {
      return { type, operator: OP_GT, target };
    }
    if (operator instanceof NumericLowerOperator) {
      return { type, operator: OP_LT, target };
    }
    if (operator instanceof NumericEqualityOperator) {
      return { type, operator: OP_EQ, target };
    }

    throw new Error("Unsupported numeric operator");
  }
}
