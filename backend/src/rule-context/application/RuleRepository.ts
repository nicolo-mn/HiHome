import { ObservableCondition } from "../domain/Observables";
import { ComponentAction } from "../domain/Actions";
import { Rule } from "../domain/Rule";

export interface RuleRepository {
  addRule(
    homeId: string,
    name: string,
    condition: ObservableCondition,
    actions: ComponentAction[],
  ): Promise<Rule>;
  getHomeRules(homeId: string): Promise<Rule[]>;
  deleteRule(ruleId: string): Promise<void>;
  reorderRules(homeId: string, orderedIds: string[]): Promise<Rule[]>;
}
