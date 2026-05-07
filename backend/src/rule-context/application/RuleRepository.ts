import { Rule, RuleAction, RuleTrigger } from "../domain/Entities";

export interface RuleRepository {
  addRule(
    homeId: string,
    name: string,
    trigger: RuleTrigger,
    actions: RuleAction[],
  ): Promise<Rule>;
  getHomeRules(homeId: string): Promise<Rule[]>;
  deleteRule(ruleId: string): Promise<void>;
}
