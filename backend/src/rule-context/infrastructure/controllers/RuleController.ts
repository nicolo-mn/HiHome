import { Request, Response } from "express";
import {
  RuleService,
  AddRuleDto,
} from "../../application/services/RuleService";
import { ObservableCondition } from "../../domain/Observables";
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
import { Rule } from "../../domain/Rule";
import { ConditionDto, ConditionDtoVisitor } from "./ConditionDtoVisitor";

type ActionDto = {
  type: string;
  deviceId: string;
  targetTemperature?: number;
  mode?: FanMode;
};
type TimeWindowDto = { days?: number[]; start?: string; end?: string };
type RuleDto = {
  id: string;
  name: string;
  order: number;
  condition: ConditionDto;
  actions: ActionDto[];
  timeWindow?: TimeWindowDto;
};

function conditionToDto(condition: ObservableCondition): ConditionDto {
  return condition.accept(new ConditionDtoVisitor());
}

function actionToDto(action: DeviceAction): ActionDto {
  if (action instanceof LightTurnOnAction)
    return { type: "light-turn-on", deviceId: action.getDeviceId() };
  if (action instanceof LightTurnOffAction)
    return { type: "light-turn-off", deviceId: action.getDeviceId() };
  if (action instanceof WindowOpenAction)
    return { type: "window-open", deviceId: action.getDeviceId() };
  if (action instanceof WindowCloseAction)
    return { type: "window-close", deviceId: action.getDeviceId() };
  if (action instanceof ThermostatSetTemperatureAction) {
    return {
      type: "thermostat-set-temperature",
      deviceId: action.getDeviceId(),
      targetTemperature: action.targetTemperature,
    };
  }
  if (action instanceof LockLockAction)
    return { type: "lock-lock", deviceId: action.getDeviceId() };
  if (action instanceof LockUnlockAction)
    return { type: "lock-unlock", deviceId: action.getDeviceId() };
  if (action instanceof FanSetModeAction) {
    return {
      type: "fan-set-mode",
      deviceId: action.getDeviceId(),
      mode: action.mode,
    };
  }
  throw new Error("Unsupported action type");
}

function ruleToDto(rule: Rule): RuleDto {
  return {
    id: rule.id,
    name: rule.name,
    order: rule.order,
    condition: conditionToDto(rule.condition),
    actions: rule.actions.map(actionToDto),
    timeWindow: rule.timeWindow?.value,
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
      const dto: AddRuleDto = {
        homeId,
        ruleName: req.body.ruleName as string,
        observableId: req.body.observableId as AddRuleDto["observableId"],
        operator: req.body.operator as AddRuleDto["operator"],
        operatorTarget: req.body.operatorTarget,
        actions: req.body.actions as AddRuleDto["actions"],
        timeWindow: req.body.timeWindow as AddRuleDto["timeWindow"],
      };

      const newRule = await this.ruleService.addRule(dto);

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

  async reorderRules(req: Request, res: Response) {
    try {
      const homeId = req.params.id as string;
      const ruleIds = req.body.ruleIds as string[];
      await this.ruleService.reorderRules(homeId, ruleIds);
      res.json({ message: "Rules reordered successfully" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
