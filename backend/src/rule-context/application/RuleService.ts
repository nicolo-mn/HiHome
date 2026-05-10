import {
  ObservableCondition,
  ObservablesUpdatedDomainEvent,
  WeatherForecast,
} from "../domain/Observables";
import { ComponentAction } from "../domain/Actions";
import { RuleRepository } from "./RuleRepository";
import { Rule } from "../domain/Rule";
import { ComponentActionExecutionVisitor } from "./ComponentActionExecutionVisitor";
import { ActionExecutionPort } from "../domain/ActionExecutionPort";

export class RuleService {
  constructor(
    private ruleRepo: RuleRepository,
    private actionExecutionPort: ActionExecutionPort,
  ) {}

  async getRulesForHome(homeId: string): Promise<Rule[]> {
    return await this.ruleRepo.getHomeRules(homeId);
  }

  async addRule(
    homeId: string,
    name: string,
    condition: ObservableCondition,
    actions: ComponentAction[],
  ): Promise<Rule> {
    return await this.ruleRepo.addRule(homeId, name, condition, actions);
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.ruleRepo.deleteRule(ruleId);
  }

  async executeRulesForHome(
    homeId: string,
    update: ObservablesUpdatedDomainEvent,
  ): Promise<void> {
    const rules = await this.ruleRepo.getHomeRules(homeId);
    const actionPerComponent = new Map<string, ComponentAction>();
    for (const rule of rules) {
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
}
