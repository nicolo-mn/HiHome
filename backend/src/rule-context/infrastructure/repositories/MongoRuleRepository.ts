import {
  ObservableCondition,
  WeatherCondition,
  WeatherEqualityOperator,
  WeatherForecast,
  ExternalTemperatureCondition,
  InternalTemperatureCondition,
  AirQualityCondition,
  WindSpeedCondition,
  NumericGreaterOperator,
  NumericLowerOperator,
  NumericEqualityOperator,
} from "../../domain/Observables";
import {
  DeviceAction,
  FanMode,
  FanSetModeAction,
  LightTurnOnAction,
  LightTurnOffAction,
  LockLockAction,
  LockUnlockAction,
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
} from "../../domain/Actions";
import { RuleRepository } from "../../application/repositories/RuleRepository";
import { Rule } from "../../domain/Rule";
import { HomeRuleSet } from "../../domain/HomeRuleSet";
import { RuleModel } from "../models/RuleModel";

const WEATHER_TYPE = "weather";
const EXTERNAL_TEMP_TYPE = "external-thermometer";
const INTERNAL_TEMP_TYPE = "internal-thermometer";
const AIR_QUALITY_TYPE = "air-quality";
const WIND_SPEED_TYPE = "wind-speed";

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
  deviceId: string;
  targetTemperature?: number;
  mode?: FanMode;
};

type RuleRecord = {
  _id: string | { toString(): string };
  homeId: string;
  name: string;
  order: number;
  condition: ConditionRecord;
  actions: ActionRecord[];
};

export class MongoRuleRepository implements RuleRepository {
  async getHomeRules(homeId: string): Promise<Rule[]> {
    const docs = await RuleModel.find({ homeId })
      .sort({ order: 1 })
      .lean<RuleRecord[]>()
      .exec();
    return docs.map((doc: RuleRecord) => this.toDomain(doc));
  }

  async getRule(ruleId: string): Promise<Rule> {
    const doc = await RuleModel.findById(ruleId).lean<RuleRecord>().exec();
    if (!doc) {
      throw new Error("Rule not found");
    }
    return this.toDomain(doc);
  }

  async findHomeRuleSet(homeId: string): Promise<HomeRuleSet> {
    const rules = await this.getHomeRules(homeId);
    return HomeRuleSet.fromPersisted(homeId, rules);
  }

  async addRule(
    homeId: string,
    name: string,
    condition: ObservableCondition,
    actions: DeviceAction[],
    order: number,
  ): Promise<Rule> {
    if (actions.length === 0)
      throw new Error("A rule must have at least one action");

    const record = {
      homeId,
      name,
      order,
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

  async reorderRules(
    homeId: string,
    positions: { id: string; order: number }[],
  ): Promise<void> {
    if (positions.length === 0) return;
    await RuleModel.bulkWrite(
      positions.map((p) => ({
        updateOne: {
          filter: { _id: p.id, homeId },
          update: { $set: { order: p.order } },
        },
      })),
    );
  }

  private toDomain(record: RuleRecord): Rule {
    return {
      id: record._id.toString(),
      homeId: record.homeId,
      name: record.name,
      order: record.order,
      condition: this.toCondition(record.condition),
      actions: record.actions.map((action) => this.toAction(action)),
    };
  }

  private toCondition(record: ConditionRecord): ObservableCondition {
    if (record.type === WEATHER_TYPE) {
      const forecast = this.parseWeatherForecast(record.target as string);
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
      case WIND_SPEED_TYPE:
        return new WindSpeedCondition(operator);
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

  private parseWeatherForecast(target: string): WeatherForecast {
    const forecast = WeatherForecast[target as keyof typeof WeatherForecast];
    if (forecast === undefined) {
      throw new Error(`Unsupported weather forecast: ${target}`);
    }
    return forecast;
  }

  private toConditionRecord(condition: ObservableCondition): ConditionRecord {
    if (condition instanceof WeatherCondition) {
      return {
        type: WEATHER_TYPE,
        operator: OP_EQ,
        target: condition.operator.getBoundaryValue(),
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

    if (condition instanceof WindSpeedCondition) {
      return this.toNumericConditionRecord(condition, WIND_SPEED_TYPE);
    }

    throw new Error("Unsupported condition type");
  }

  private toNumericConditionRecord(
    condition:
      | ExternalTemperatureCondition
      | InternalTemperatureCondition
      | AirQualityCondition
      | WindSpeedCondition,
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

  private toActionRecord(action: DeviceAction): ActionRecord {
    if (action instanceof LightTurnOnAction) {
      return {
        type: "light-turn-on",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
      };
    }

    if (action instanceof LightTurnOffAction) {
      return {
        type: "light-turn-off",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
      };
    }

    if (action instanceof WindowOpenAction) {
      return {
        type: "window-open",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
      };
    }

    if (action instanceof WindowCloseAction) {
      return {
        type: "window-close",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
      };
    }

    if (action instanceof ThermostatSetTemperatureAction) {
      return {
        type: "thermostat-set-temperature",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
        targetTemperature: action.targetTemperature,
      };
    }

    if (action instanceof LockLockAction) {
      return {
        type: "lock-lock",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
      };
    }

    if (action instanceof LockUnlockAction) {
      return {
        type: "lock-unlock",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
      };
    }

    if (action instanceof FanSetModeAction) {
      return {
        type: "fan-set-mode",
        homeId: action.getHomeId(),
        deviceId: action.getDeviceId(),
        mode: action.mode,
      };
    }

    throw new Error("Unsupported action type");
  }

  private toAction(record: ActionRecord): DeviceAction {
    switch (record.type) {
      case "light-turn-on":
        return new LightTurnOnAction(record.homeId, record.deviceId);
      case "light-turn-off":
        return new LightTurnOffAction(record.homeId, record.deviceId);
      case "window-open":
        return new WindowOpenAction(record.homeId, record.deviceId);
      case "window-close":
        return new WindowCloseAction(record.homeId, record.deviceId);
      case "thermostat-set-temperature":
        return new ThermostatSetTemperatureAction(
          record.homeId,
          record.deviceId,
          record.targetTemperature ?? 0,
        );
      case "lock-lock":
        return new LockLockAction(record.homeId, record.deviceId);
      case "lock-unlock":
        return new LockUnlockAction(record.homeId, record.deviceId);
      case "fan-set-mode":
        return new FanSetModeAction(
          record.homeId,
          record.deviceId,
          record.mode ?? "off",
        );
      default:
        throw new Error(`Unsupported action type: ${record.type}`);
    }
  }
}
