import {
  ObservableCondition,
  ObservablesUpdatedDomainEvent,
  WeatherForecast,
  NumericEqualityOperator,
  NumericGreaterOperator,
  NumericLowerOperator,
  WeatherEqualityOperator,
  ExternalTemperatureCondition,
  WindSpeedCondition,
  AirQualityCondition,
  WeatherCondition,
} from "../domain/Observables";
import {
  ComponentAction,
  LightTurnOnAction,
  LightTurnOffAction,
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
} from "../domain/Actions";
import { RuleRepository } from "./RuleRepository";
import { Rule } from "../domain/Rule";
import { ComponentActionExecutionVisitor } from "./ComponentActionExecutionVisitor";
import { ActionExecutionPort } from "../domain/ActionExecutionPort";

export type RuleActionDto = {
  componentType: "light" | "window" | "thermostat";
  command: "turnOn" | "turnOff" | "open" | "close" | "setTemperature";
  componentId: string | number;
  targetTemp?: string | number;
};

export type AddRuleDto = {
  homeId: string;
  ruleName: string;
  observableId:
    | "weather"
    | "external-thermometer"
    | "internal-thermometer"
    | "wind-speed"
    | "air-quality";
  operator?: "gt" | "lt" | "eq";
  operatorTarget: string | number;
  actions: RuleActionDto[];
};

export class RuleService {
  constructor(
    private ruleRepo: RuleRepository,
    private actionExecutionPort: ActionExecutionPort,
  ) {}

  async getRulesForHome(homeId: string): Promise<Rule[]> {
    return await this.ruleRepo.getHomeRules(homeId);
  }

  async addRule(dto: AddRuleDto): Promise<Rule> {
    const condition = this.buildCondition(dto);
    const actions = this.buildActions(dto.homeId, dto.actions);
    const ruleSet = await this.ruleRepo.findHomeRuleSet(dto.homeId);
    return await this.ruleRepo.addRule(
      dto.homeId,
      dto.ruleName,
      condition,
      actions,
      ruleSet.nextOrder(),
    );
  }

  async deleteRule(ruleId: string): Promise<void> {
    const rule = await this.ruleRepo.getRule(ruleId);
    const ruleSet = await this.ruleRepo.findHomeRuleSet(rule.homeId);
    ruleSet.remove(ruleId);
    await this.ruleRepo.deleteRule(ruleId);
    await this.ruleRepo.reorderRules(rule.homeId, ruleSet.positions());
  }

  async reorderRules(homeId: string, orderedRuleIds: string[]): Promise<void> {
    const ruleSet = await this.ruleRepo.findHomeRuleSet(homeId);
    ruleSet.reorder(orderedRuleIds);
    await this.ruleRepo.reorderRules(homeId, ruleSet.positions());
  }

  async executeRulesForHome(
    homeId: string,
    update: ObservablesUpdatedDomainEvent,
  ): Promise<void> {
    const rulesByPriority = await this.ruleRepo.getHomeRules(homeId);
    const actionPerComponent = new Map<string, ComponentAction>();
    for (const rule of rulesByPriority) {
      if (rule.condition.verify(update)) {
        rule.actions
          .filter((action) => !actionPerComponent.has(action.getComponentId()))
          .forEach((action) =>
            actionPerComponent.set(action.getComponentId(), action),
          );
      }
    }

    const actionExecutor = new ComponentActionExecutionVisitor(
      this.actionExecutionPort,
    );
    const actions = Array.from(actionPerComponent.values());
    await Promise.all(actions.map((a) => a.accept(actionExecutor)));
  }

  private buildCondition(dto: AddRuleDto): ObservableCondition {
    if (dto.observableId === "weather") {
      const targetText = String(dto.operatorTarget);
      const titleCaseTarget =
        targetText.charAt(0).toUpperCase() + targetText.slice(1).toLowerCase();
      const forecast =
        WeatherForecast[titleCaseTarget as keyof typeof WeatherForecast];
      const operator = new WeatherEqualityOperator(forecast);
      return new WeatherCondition(operator);
    }

    const targetValue = Number.parseFloat(String(dto.operatorTarget));
    let numericOperator;

    switch (dto.operator) {
      case "gt":
        numericOperator = new NumericGreaterOperator(targetValue);
        break;
      case "lt":
        numericOperator = new NumericLowerOperator(targetValue);
        break;
      case "eq":
        numericOperator = new NumericEqualityOperator(targetValue);
        break;
      default:
        throw new Error("Invalid operator for numeric condition");
    }

    if (
      dto.observableId === "internal-thermometer" ||
      dto.observableId === "external-thermometer"
    ) {
      return new ExternalTemperatureCondition(numericOperator);
    }
    if (dto.observableId === "wind-speed") {
      return new WindSpeedCondition(numericOperator);
    }
    if (dto.observableId === "air-quality") {
      return new AirQualityCondition(numericOperator);
    }

    throw new Error("Invalid observableId");
  }

  private buildActions(
    homeId: string,
    actionsData: RuleActionDto[],
  ): ComponentAction[] {
    return actionsData.map((actionData) => {
      if (actionData.componentType === "light") {
        return actionData.command === "turnOn"
          ? new LightTurnOnAction(homeId, actionData.componentId.toString())
          : new LightTurnOffAction(homeId, actionData.componentId.toString());
      }
      if (actionData.componentType === "window") {
        return actionData.command === "open"
          ? new WindowOpenAction(homeId, actionData.componentId.toString())
          : new WindowCloseAction(homeId, actionData.componentId.toString());
      }
      if (
        actionData.componentType === "thermostat" &&
        actionData.command === "setTemperature"
      ) {
        return new ThermostatSetTemperatureAction(
          homeId,
          actionData.componentId.toString(),
          Number.parseFloat(String(actionData.targetTemp)),
        );
      }
      throw new Error("Invalid action");
    });
  }
}
