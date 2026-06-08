import {
  ObservableCondition,
  WeatherCondition,
  WeatherEqualityOperator,
  WeatherForecast,
  OutdoorTemperatureCondition,
  IndoorTemperatureCondition,
  AirQualityCondition,
  WindSpeedCondition,
  NumericGreaterOperator,
  NumericLowerOperator,
  NumericEqualityOperator,
} from "../../domain/Observables";
import {
  DeviceAction,
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
import { TimeWindow, TimeWindowSpec } from "../../domain/TimeWindow";
import { RuleModel } from "../models/RuleModel";
import {
  ConditionRecord,
  ConditionRecordVisitor,
  WEATHER_TYPE,
  OUTDOOR_TEMP_TYPE,
  INDOOR_TEMP_TYPE,
  AIR_QUALITY_TYPE,
  WIND_SPEED_TYPE,
  OP_GT,
  OP_LT,
  OP_EQ,
} from "./ConditionRecordVisitor";
import { ActionRecord, ActionRecordVisitor } from "./ActionRecordVisitor";

type RuleRecord = {
  _id: string | { toString(): string };
  homeId: string;
  name: string;
  order: number;
  condition: ConditionRecord;
  actions: ActionRecord[];
  timeWindow?: TimeWindowSpec;
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
    timeWindow?: TimeWindow,
  ): Promise<Rule> {
    if (actions.length === 0)
      throw new Error("A rule must have at least one action");

    const record = {
      homeId,
      name,
      order,
      condition: condition.accept(new ConditionRecordVisitor()),
      actions: actions.map((action) =>
        action.accept(new ActionRecordVisitor()),
      ),
      timeWindow: timeWindow?.value,
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
      timeWindow: record.timeWindow
        ? new TimeWindow(record.timeWindow)
        : undefined,
    };
  }

  private toCondition(record: ConditionRecord): ObservableCondition {
    if (record.type === WEATHER_TYPE) {
      const forecast = this.parseWeatherForecast(record.target as string);
      return new WeatherCondition(new WeatherEqualityOperator(forecast));
    }

    const operator = this.toNumericOperator(record.operator, record.target);

    switch (record.type) {
      case OUTDOOR_TEMP_TYPE:
        return new OutdoorTemperatureCondition(operator);
      case INDOOR_TEMP_TYPE:
        return new IndoorTemperatureCondition(operator);
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
