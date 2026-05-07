import { Rule, RuleAction, RuleTrigger } from "./Entities";

export class RuleFactory {
  private constructor() {}

  static createTrigger(
    observableId: string,
    operator: RuleTrigger["operator"],
    value: number | string,
  ): RuleTrigger {
    return { observableId, operator, value };
  }

  static createAction(
    componentId: string,
    capabilityId: string,
    commandId: string,
    params?: Record<string, number>,
  ): RuleAction {
    return { componentId, capabilityId, commandId, params };
  }

  static createRule(
    id: string,
    homeId: string,
    name: string,
    trigger: RuleTrigger,
    actions: RuleAction[],
    enabled: boolean = true,
  ): Rule {
    return { id, homeId, name, enabled, trigger, actions };
  }
}
