interface ConditionVisitor<T> {
  visitWeatherCondition<T>(cond: ObservableCondition): T;
  visitTemperatureCondition<T>(cond: ObservableCondition): T;
  visitAirQualityCondition<T>(cond: ObservableCondition): T;
  visitWindSpeedCondition<T>(cond: ObservableCondition): T;
}

export enum WeatherForecast {
  Clear,
  Drizzle,
  Fog,
  Overcast,
  Cloudy,
  Rain,
  Snow,
  Thunderstorm,
}

export type ObservablesUpdatedDomainEvent = {
  externalTemperature: number;
  internalTemperature: number;
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
  private prev = false;

  protected checkStateChange(current: boolean): boolean {
    const old = this.prev;
    this.prev = current;
    return this.prev && old !== this.prev;
  }

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
    return super.checkStateChange(
      this.operator.evaluate(update.weatherForecast),
    );
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

  protected checkStateChangeAndAssertInRange(value: number): boolean {
    assertInRange(this.conditionDesc, value, this.min, this.max);
    return super.checkStateChange(this.operator.evaluate(value));
  }
}

export class ExternalTemperatureCondition extends BoundedNumericCondition {
  static readonly MIN_TEMP = -20;
  static readonly MAX_TEMP = 50;

  constructor(operator: NumericOperator) {
    super(
      operator,
      ExternalTemperatureCondition.MIN_TEMP,
      ExternalTemperatureCondition.MAX_TEMP,
      "ExternalTemperatureCondition",
    );
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitTemperatureCondition(this);
  }

  verify(update: ObservablesUpdatedDomainEvent): boolean {
    return this.checkStateChangeAndAssertInRange(update.externalTemperature);
  }
}

export class InternalTemperatureCondition extends BoundedNumericCondition {
  static readonly MIN_TEMP = -20;
  static readonly MAX_TEMP = 50;

  constructor(operator: NumericOperator) {
    super(
      operator,
      InternalTemperatureCondition.MIN_TEMP,
      InternalTemperatureCondition.MAX_TEMP,
      "InternalTemperatureCondition",
    );
  }

  accept<R>(visitor: ConditionVisitor<R>): R {
    return visitor.visitTemperatureCondition(this);
  }

  verify(update: ObservablesUpdatedDomainEvent): boolean {
    return this.checkStateChangeAndAssertInRange(update.internalTemperature);
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
    return this.checkStateChangeAndAssertInRange(update.airQuality);
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
    return this.checkStateChangeAndAssertInRange(update.windSpeed);
  }
}
