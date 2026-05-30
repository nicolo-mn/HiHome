interface ConditionVisitor<T> {
  visitWeatherCondition<T>(cond: ObservableCondition): T;
  visitTemperatureCondition<T>(cond: ObservableCondition): T;
  visitAirQualityCondition<T>(cond: ObservableCondition): T;
  visitWindSpeedCondition<T>(cond: ObservableCondition): T;
}

export enum WeatherForecast {
  Clear = "Clear",
  Drizzle = "Drizzle",
  Fog = "Fog",
  Overcast = "Overcast",
  Cloudy = "Cloudy",
  Rain = "Rain",
  Snow = "Snow",
  Thunderstorm = "Thunderstorm",
}

export type ObservablesUpdatedDomainEvent = {
  outdoorTemperature: number;
  indoorTemperature: number;
  airQuality: number;
  windSpeed: number;
  weatherForecast: WeatherForecast;
};

interface Operator<T> {
  evaluate(value: T): boolean;
  getBoundaryValue(): T;
}

abstract class NumericOperator implements Operator<number> {
  protected constructor(
    private readonly operation: (value: number) => boolean,
    private readonly boundaryValue: number,
  ) {}

  evaluate(value: number): boolean {
    return this.operation(value);
  }

  getBoundaryValue(): number {
    return this.boundaryValue;
  }
}

export class NumericEqualityOperator extends NumericOperator {
  constructor(target: number) {
    super((n) => n == target, target);
  }
}

export class NumericGreaterOperator extends NumericOperator {
  constructor(target: number) {
    super((n) => n > target, target);
  }
}

export class NumericLowerOperator extends NumericOperator {
  constructor(target: number) {
    super((n) => n < target, target);
  }
}

export class WeatherEqualityOperator implements Operator<WeatherForecast> {
  constructor(private readonly targetForecast: WeatherForecast) {}

  evaluate(value: WeatherForecast): boolean {
    return this.targetForecast === value;
  }

  getBoundaryValue(): WeatherForecast {
    return this.targetForecast;
  }
}

export interface ObservableCondition {
  verify(update: ObservablesUpdatedDomainEvent): boolean;
  accept<T>(visitor: ConditionVisitor<T>): T;
}

abstract class AbstractCondition implements ObservableCondition {
  abstract verify(update: ObservablesUpdatedDomainEvent): boolean;

  abstract accept<R>(visitor: ConditionVisitor<R>): R;
}

export class BoundaryViolationError extends RangeError {
  constructor(conditionName: string, value: number, min: number, max: number) {
    super(
      `${conditionName}: value ${value} is outside the allowed range ` +
        `[${min}, ${max}].`,
    );
    this.name = "BoundaryViolationError";
  }
}

function assertInRange(
  conditionName: string,
  value: number,
  min: number,
  max: number,
): void {
  if (value < min || value > max) {
    throw new BoundaryViolationError(conditionName, value, min, max);
  }
}

export class WeatherCondition extends AbstractCondition {
  constructor(readonly operator: WeatherEqualityOperator) {
    super();
  }

  verify(update: ObservablesUpdatedDomainEvent) {
    return this.operator.evaluate(update.weatherForecast);
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitWeatherCondition(this);
  }
}

abstract class BoundedNumericCondition extends AbstractCondition {
  protected constructor(
    readonly operator: NumericOperator,
    private readonly min: number,
    private readonly max: number,
    private readonly conditionDesc: string,
  ) {
    assertInRange(conditionDesc, operator.getBoundaryValue(), min, max);
    super();
  }

  protected assertInRangeAndEvaluate(value: number): boolean {
    assertInRange(this.conditionDesc, value, this.min, this.max);
    return this.operator.evaluate(value);
  }
}

export class OutdoorTemperatureCondition extends BoundedNumericCondition {
  static readonly MIN_TEMP = 5;
  static readonly MAX_TEMP = 40;

  constructor(operator: NumericOperator) {
    super(
      operator,
      OutdoorTemperatureCondition.MIN_TEMP,
      OutdoorTemperatureCondition.MAX_TEMP,
      "OutdoorTemperatureCondition",
    );
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitTemperatureCondition(this);
  }

  verify(update: ObservablesUpdatedDomainEvent): boolean {
    return this.assertInRangeAndEvaluate(update.outdoorTemperature);
  }
}

export class IndoorTemperatureCondition extends BoundedNumericCondition {
  static readonly MIN_TEMP = 5;
  static readonly MAX_TEMP = 40;

  constructor(operator: NumericOperator) {
    super(
      operator,
      IndoorTemperatureCondition.MIN_TEMP,
      IndoorTemperatureCondition.MAX_TEMP,
      "IndoorTemperatureCondition",
    );
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitTemperatureCondition(this);
  }

  verify(update: ObservablesUpdatedDomainEvent): boolean {
    return this.assertInRangeAndEvaluate(update.indoorTemperature);
  }
}

export class AirQualityCondition extends BoundedNumericCondition {
  static readonly MIN_AQI = 0;
  static readonly MAX_AQI = 150;

  constructor(operator: NumericOperator) {
    super(
      operator,
      AirQualityCondition.MIN_AQI,
      AirQualityCondition.MAX_AQI,
      "AirQualityCondition",
    );
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitAirQualityCondition(this);
  }

  verify(update: ObservablesUpdatedDomainEvent): boolean {
    return this.assertInRangeAndEvaluate(update.airQuality);
  }
}

export class WindSpeedCondition extends BoundedNumericCondition {
  static readonly MIN_WIND_SPEED = 0;
  static readonly MAX_WIND_SPEED = 60;

  constructor(operator: NumericOperator) {
    super(
      operator,
      WindSpeedCondition.MIN_WIND_SPEED,
      WindSpeedCondition.MAX_WIND_SPEED,
      "WindSpeedCondition",
    );
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitWindSpeedCondition(this);
  }

  verify(update: ObservablesUpdatedDomainEvent): boolean {
    return this.assertInRangeAndEvaluate(update.windSpeed);
  }
}
