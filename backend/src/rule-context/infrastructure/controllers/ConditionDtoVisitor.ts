import {
  NumericOperator,
  NumericGreaterOperator,
  NumericLowerOperator,
  OutdoorTemperatureCondition,
  IndoorTemperatureCondition,
  WindSpeedCondition,
  AirQualityCondition,
  WeatherCondition,
  ConditionVisitor,
} from "../../domain/Observables";

export type ConditionDto = {
  type: string;
  operator: string;
  target: string | number;
};

function numericOperatorToString(op: NumericOperator): string {
  if (op instanceof NumericGreaterOperator) return "gt";
  if (op instanceof NumericLowerOperator) return "lt";
  return "eq";
}

export class ConditionDtoVisitor implements ConditionVisitor<ConditionDto> {
  visitWeatherCondition(cond: WeatherCondition): ConditionDto {
    return {
      type: "weather",
      operator: "is",
      target: cond.operator.getBoundaryValue(),
    };
  }

  visitOutdoorTemperatureCondition(
    cond: OutdoorTemperatureCondition,
  ): ConditionDto {
    return this.numericDto("outdoor-thermometer", cond.operator);
  }

  visitIndoorTemperatureCondition(
    cond: IndoorTemperatureCondition,
  ): ConditionDto {
    return this.numericDto("indoor-thermometer", cond.operator);
  }

  visitAirQualityCondition(cond: AirQualityCondition): ConditionDto {
    return this.numericDto("air-quality", cond.operator);
  }

  visitWindSpeedCondition(cond: WindSpeedCondition): ConditionDto {
    return this.numericDto("wind-speed", cond.operator);
  }

  private numericDto(type: string, op: NumericOperator): ConditionDto {
    return {
      type,
      operator: numericOperatorToString(op),
      target: op.getBoundaryValue(),
    };
  }
}
