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
  InternalTemperatureCondition,
} from "../../domain/Observables";
import {
  ComponentAction,
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
import { RuleRepository } from "../repositories/RuleRepository";
import { Rule } from "../../domain/Rule";
import { ComponentActionExecutionVisitor } from "../ComponentActionExecutionVisitor";
import { ActionExecutionPort } from "../../domain/ActionExecutionPort";
import { RuleNotificationPort } from "../ports/RuleNotificationPort";
import { ActionDescriptionVisitor } from "../ActionDescriptionVisitor";
import { ComponentNameResolverPort } from "../ports/ComponentNameResolverPort";

export type RuleActionDto = {
  componentType: "light" | "window" | "thermostat" | "lock" | "fan";
  command:
    | "turnOn"
    | "turnOff"
    | "open"
    | "close"
    | "setTemperature"
    | "lock"
    | "unlock"
    | "setOff"
    | "setLow"
    | "setMedium"
    | "setHigh";
  componentId: string | number;
  targetTemp?: string | number;
};

const FAN_COMMAND_TO_MODE: Record<string, FanMode> = {
  setOff: "off",
  setLow: "low",
  setMedium: "medium",
  setHigh: "high",
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
  private lastMatchByRuleId = new Map<string, boolean>();

  constructor(
    private ruleRepo: RuleRepository,
    private actionExecutionPort: ActionExecutionPort,
    private ruleNotificationPort?: RuleNotificationPort,
    private componentNameResolver?: ComponentNameResolverPort,
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
    console.log(`Executing rules for home ${homeId} with update:`, update);
    const rulesByPriority = await this.ruleRepo.getHomeRules(homeId);
    const actionPerComponent = new Map<string, ComponentAction>();
    const ruleNameByAction = new Map<ComponentAction, string>();
    for (const rule of rulesByPriority) {
      const currentMatch = rule.condition.verify(update);
      const prevMatch = this.lastMatchByRuleId.get(rule.id) ?? false;
      const shouldFire = currentMatch && !prevMatch;
      this.lastMatchByRuleId.set(rule.id, currentMatch);

      if (shouldFire) {
        for (const action of rule.actions) {
          if (actionPerComponent.has(action.getComponentId())) continue;
          actionPerComponent.set(action.getComponentId(), action);
          ruleNameByAction.set(action, rule.name);
        }
      }
    }

    const actionExecutor = new ComponentActionExecutionVisitor(
      this.actionExecutionPort,
    );
    const actions = Array.from(actionPerComponent.values());
    await Promise.all(actions.map((a) => a.accept(actionExecutor)));

    if (actions.length === 0) {
      console.log(`No actions executed for home ${homeId}`);
      return;
    }

    console.log(
      `Executed actions for home ${homeId}:`,
      actions.map((a) => ({
        componentId: a.getComponentId(),
        actionType: a.constructor.name,
      })),
    );

    if (!this.ruleNotificationPort) return;

    const componentIds = Array.from(
      new Set(actions.map((a) => a.getComponentId())),
    );
    const nameEntries = await Promise.all(
      componentIds.map(
        async (id): Promise<[string, string]> => [
          id,
          (await this.componentNameResolver?.getComponentName(id)) ?? id,
        ],
      ),
    );
    const componentNameById = new Map<string, string>(nameEntries);

    const descriptionVisitor = new ActionDescriptionVisitor(componentNameById);
    const actionsByRule = new Map<string, string[]>();
    for (const action of actions) {
      const ruleName = ruleNameByAction.get(action)!;
      const description = action.accept(descriptionVisitor);
      const list = actionsByRule.get(ruleName) ?? [];
      list.push(description);
      actionsByRule.set(ruleName, list);
    }
    const executions = Array.from(actionsByRule.entries()).map(
      ([ruleName, actionDescriptions]) => ({
        ruleName,
        actions: actionDescriptions,
      }),
    );
    await this.ruleNotificationPort.notifyRulesExecuted(homeId, { executions });
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

    if (dto.observableId === "external-thermometer") {
      return new ExternalTemperatureCondition(numericOperator);
    }
    if (dto.observableId === "internal-thermometer") {
      return new InternalTemperatureCondition(numericOperator);
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
      if (actionData.componentType === "lock") {
        return actionData.command === "lock"
          ? new LockLockAction(homeId, actionData.componentId.toString())
          : new LockUnlockAction(homeId, actionData.componentId.toString());
      }
      if (actionData.componentType === "fan") {
        const mode = FAN_COMMAND_TO_MODE[actionData.command];
        if (!mode) throw new Error("Invalid action");
        return new FanSetModeAction(
          homeId,
          actionData.componentId.toString(),
          mode,
        );
      }
      throw new Error("Invalid action");
    });
  }
}
