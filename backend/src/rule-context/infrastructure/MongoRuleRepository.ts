import {
  ObservableCondition,
  WeatherCondition,
  WeatherEqualityOperator,
  WeatherForecast,
  ExternalTemperatureCondition,
  InternalTemperatureCondition,
  AirQualityCondition,
  NumericGreaterOperator,
  NumericLowerOperator,
  NumericEqualityOperator,
} from "../domain/Observables";
import {
  ComponentAction,
  LightTurnOnAction,
  LightTurnOffAction,
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
} from "../domain/Actions";
import { RuleRepository } from "../application/RuleRepository";
import { Rule } from "../domain/Rule";
import { RuleModel } from "./models/RuleModel";

const WEATHER_TYPE = "weather";
const EXTERNAL_TEMP_TYPE = "external-thermometer";
const INTERNAL_TEMP_TYPE = "internal-thermometer";
const AIR_QUALITY_TYPE = "air-quality";

const OP_EQ = "eq";
const OP_GT = "gt";
const OP_LT = "lt";

type ConditionRecord = {
  type: string;
  operator: string;
  target: string | number;
};

type ActionRecord = {
  type: string;
  homeId: string;
  componentId: string;
  targetTemperature?: number;
};

type RuleRecord = {
  _id: string | { toString(): string };
  homeId: string;
  name: string;
  condition: ConditionRecord;
  actions: ActionRecord[];
};

export class MongoRuleRepository implements RuleRepository {
  async getHomeRules(homeId: string): Promise<Rule[]> {
    const docs = await RuleModel.find({ homeId }).lean<RuleRecord[]>().exec();
    return docs.map((doc: RuleRecord) => this.toDomain(doc));
  }

  async addRule(
    homeId: string,
    name: string,
    condition: ObservableCondition,
    actions: ComponentAction[],
  ): Promise<Rule> {
    if (actions.length === 0)
      throw new Error("A rule must have at least one action");

    const record = {
      homeId,
      name,
      condition: this.toConditionRecord(condition),
      actions: actions.map((action) => this.toActionRecord(action)),
    };

    const doc = await RuleModel.create(record);
    return this.toDomain(doc.toObject());
  }

  async deleteRule(ruleId: string): Promise<void> {
    const result = await RuleModel.findByIdAndDelete(ruleId).exec();
    if (!result) {
      throw new Error("Rule not found");
    }
  }

  private toDomain(record: RuleRecord): Rule {
    return {
      id: record._id.toString(),
      homeId: record.homeId,
      name: record.name,
      condition: this.toCondition(record.condition),
      actions: record.actions.map((action) => this.toAction(action)),
    };
  }

  private toCondition(record: ConditionRecord): ObservableCondition {
    if (record.type === WEATHER_TYPE) {
      const forecast = this.parseWeatherForecast(record.target);
      return new WeatherCondition(new WeatherEqualityOperator(forecast));
    }

    const operator = this.toNumericOperator(record.operator, record.target);

    switch (record.type) {
      case EXTERNAL_TEMP_TYPE:
        return new ExternalTemperatureCondition(operator);
      case INTERNAL_TEMP_TYPE:
        return new InternalTemperatureCondition(operator);
      case AIR_QUALITY_TYPE:
        return new AirQualityCondition(operator);
      default:
        throw new Error(`Unsupported condition type: ${record.type}`);
    }
  }

  private toNumericOperator(operator: string, target: string | number) {
    const numericTarget = typeof target === "number" ? target : Number(target);

    switch (operator) {
      case OP_GT:
        return new NumericGreaterOperator(numericTarget);
      case OP_LT:
        return new NumericLowerOperator(numericTarget);
      case OP_EQ:
        return new NumericEqualityOperator(numericTarget);
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  private parseWeatherForecast(target: string | number): WeatherForecast {
    if (typeof target === "number") {
      return target as WeatherForecast;
    }

    const forecast = WeatherForecast[target as keyof typeof WeatherForecast];
    if (forecast === undefined) {
      throw new Error(`Unsupported weather forecast: ${target}`);
    }
    return forecast;
  }

  private toConditionRecord(condition: ObservableCondition): ConditionRecord {
    if (condition instanceof WeatherCondition) {
      const forecastKey =
        WeatherForecast[condition.operator.getBoundaryValue()];
      return {
        type: WEATHER_TYPE,
        operator: OP_EQ,
        target: forecastKey,
      };
    }

    if (condition instanceof ExternalTemperatureCondition) {
      return this.toNumericConditionRecord(condition, EXTERNAL_TEMP_TYPE);
    }

    if (condition instanceof InternalTemperatureCondition) {
      return this.toNumericConditionRecord(condition, INTERNAL_TEMP_TYPE);
    }

    if (condition instanceof AirQualityCondition) {
      return this.toNumericConditionRecord(condition, AIR_QUALITY_TYPE);
    }

    throw new Error("Unsupported condition type");
  }

  private toNumericConditionRecord(
    condition:
      | ExternalTemperatureCondition
      | InternalTemperatureCondition
      | AirQualityCondition,
    type: string,
  ): ConditionRecord {
    const operator = condition.operator;
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

  private toActionRecord(action: ComponentAction): ActionRecord {
    if (action instanceof LightTurnOnAction) {
      return {
        type: "light-turn-on",
        homeId: action.getHomeId(),
        componentId: action.getComponentId(),
      };
    }

    if (action instanceof LightTurnOffAction) {
      return {
        type: "light-turn-off",
        homeId: action.getHomeId(),
        componentId: action.getComponentId(),
      };
    }

    if (action instanceof WindowOpenAction) {
      return {
        type: "window-open",
        homeId: action.getHomeId(),
        componentId: action.getComponentId(),
      };
    }

    if (action instanceof WindowCloseAction) {
      return {
        type: "window-close",
        homeId: action.getHomeId(),
        componentId: action.getComponentId(),
      };
    }

    if (action instanceof ThermostatSetTemperatureAction) {
      return {
        type: "thermostat-set-temperature",
        homeId: action.getHomeId(),
        componentId: action.getComponentId(),
        targetTemperature: action.targetTemperature,
      };
    }

    throw new Error("Unsupported action type");
  }

  private toAction(record: ActionRecord): ComponentAction {
    switch (record.type) {
      case "light-turn-on":
        return new LightTurnOnAction(record.homeId, record.componentId);
      case "light-turn-off":
        return new LightTurnOffAction(record.homeId, record.componentId);
      case "window-open":
        return new WindowOpenAction(record.homeId, record.componentId);
      case "window-close":
        return new WindowCloseAction(record.homeId, record.componentId);
      case "thermostat-set-temperature":
        return new ThermostatSetTemperatureAction(
          record.homeId,
          record.componentId,
          record.targetTemperature ?? 0,
        );
      default:
        throw new Error(`Unsupported action type: ${record.type}`);
    }
  }
}
