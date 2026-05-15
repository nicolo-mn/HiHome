import { Request, Response } from "express";
import { RuleService } from "../../application/RuleService";
import {
  NumericEqualityOperator,
  NumericGreaterOperator,
  NumericLowerOperator,
  WeatherEqualityOperator,
  WeatherForecast,
  ExternalTemperatureCondition,
  InternalTemperatureCondition,
  WindSpeedCondition,
  AirQualityCondition,
  WeatherCondition,
  ObservableCondition,
} from "../../domain/Observables";
import {
  ComponentAction,
  LightTurnOnAction,
  LightTurnOffAction,
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
} from "../../domain/Actions";
import { Rule } from "../../domain/Rule";

type ConditionDto = { type: string; operator: string; target: string | number };
type ActionDto = {
  type: string;
  componentId: string;
  targetTemperature?: number;
};
type RuleDto = {
  id: string;
  name: string;
  condition: ConditionDto;
  actions: ActionDto[];
};

function conditionToDto(condition: ObservableCondition): ConditionDto {
  if (condition instanceof WeatherCondition) {
    return {
      type: "weather",
      operator: "is",
      target: WeatherForecast[condition.operator.getBoundaryValue()],
    };
  }

  const bounded = condition as
    | ExternalTemperatureCondition
    | InternalTemperatureCondition
    | AirQualityCondition
    | WindSpeedCondition;
  const op = bounded.operator;
  let operatorStr: string;
  if (op instanceof NumericGreaterOperator) operatorStr = "gt";
  else if (op instanceof NumericLowerOperator) operatorStr = "lt";
  else operatorStr = "eq";

  let type: string;
  if (condition instanceof ExternalTemperatureCondition)
    type = "external-thermometer";
  else if (condition instanceof InternalTemperatureCondition)
    type = "internal-thermometer";
  else if (condition instanceof AirQualityCondition) type = "air-quality";
  else if (condition instanceof WindSpeedCondition) type = "wind-speed";
  else throw new Error("Unsupported condition type");

  return { type, operator: operatorStr, target: op.getBoundaryValue() };
}

function actionToDto(action: ComponentAction): ActionDto {
  if (action instanceof LightTurnOnAction)
    return { type: "light-turn-on", componentId: action.getComponentId() };
  if (action instanceof LightTurnOffAction)
    return { type: "light-turn-off", componentId: action.getComponentId() };
  if (action instanceof WindowOpenAction)
    return { type: "window-open", componentId: action.getComponentId() };
  if (action instanceof WindowCloseAction)
    return { type: "window-close", componentId: action.getComponentId() };
  if (action instanceof ThermostatSetTemperatureAction) {
    return {
      type: "thermostat-set-temperature",
      componentId: action.getComponentId(),
      targetTemperature: action.targetTemperature,
    };
  }
  throw new Error("Unsupported action type");
}

function ruleToDto(rule: Rule): RuleDto {
  return {
    id: rule.id,
    name: rule.name,
    condition: conditionToDto(rule.condition),
    actions: rule.actions.map(actionToDto),
  };
}

export class RuleController {
  constructor(private ruleService: RuleService) {}

  async getRules(req: Request, res: Response) {
    try {
      const rules = await this.ruleService.getRulesForHome(
        req.params.id as string,
      );
      res.json({ rules: rules.map(ruleToDto) });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async addRule(req: Request, res: Response) {
    try {
      const homeId = req.params.id as string;
      const ruleName = req.body.ruleName as string;
      const observableId = req.body.observableId as string;
      const operatorStr = req.body.operator as string;
      const operatorTarget = req.body.operatorTarget;

      let condition: ObservableCondition;

      if (observableId === "weather") {
        // match case of WeatherForecast enum to allow keyof usage
        const titleCaseTarget =
          (operatorTarget as string).charAt(0).toUpperCase() +
          (operatorTarget as string).slice(1).toLowerCase();
        const forecast =
          WeatherForecast[titleCaseTarget as keyof typeof WeatherForecast];
        const operator = new WeatherEqualityOperator(forecast);
        condition = new WeatherCondition(operator);
      } else {
        const targetValue = parseFloat(operatorTarget);
        let numericOperator;

        switch (operatorStr) {
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
          observableId === "internal-thermometer" ||
          observableId === "external-thermometer"
        ) {
          condition = new ExternalTemperatureCondition(numericOperator);
        } else if (observableId === "wind-speed") {
          condition = new WindSpeedCondition(numericOperator);
        } else if (observableId === "air-quality") {
          condition = new AirQualityCondition(numericOperator);
        } else {
          throw new Error("Invalid observableId");
        }
      }

      const actionsData = req.body.actions as any[];
      const actions: ComponentAction[] = actionsData.map((actionData) => {
        if (actionData.componentType === "light") {
          return actionData.command === "turnOn"
            ? new LightTurnOnAction(homeId, actionData.componentId.toString())
            : new LightTurnOffAction(homeId, actionData.componentId.toString());
        } else if (actionData.componentType === "window") {
          return actionData.command === "open"
            ? new WindowOpenAction(homeId, actionData.componentId.toString())
            : new WindowCloseAction(homeId, actionData.componentId.toString());
        } else if (
          actionData.componentType === "thermostat" &&
          actionData.command === "setTemperature"
        ) {
          return new ThermostatSetTemperatureAction(
            homeId,
            actionData.componentId.toString(),
            parseFloat(actionData.targetTemp),
          );
        }
        throw new Error("Invalid action");
      });

      const newRule = await this.ruleService.addRule(
        homeId,
        ruleName,
        condition,
        actions,
      );

      res.status(201).json({
        ruleId: newRule.id,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async deleteRule(req: Request, res: Response) {
    try {
      await this.ruleService.deleteRule(req.params.ruleId as string);
      res.json({ message: "Rule deleted successfully" });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }
}
