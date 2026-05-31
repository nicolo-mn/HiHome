import { ObservableCondition } from "../../domain/Observables";
import { DeviceAction } from "../../domain/Actions";
import { Rule } from "../../domain/Rule";
import { HomeRuleSet } from "../../domain/HomeRuleSet";
import { TimeWindow } from "../../domain/TimeWindow";

export interface RuleRepository {
  addRule(
    homeId: string,
    name: string,
    condition: ObservableCondition,
    actions: DeviceAction[],
    order: number,
    timeWindow?: TimeWindow,
  ): Promise<Rule>;
  // Returned rules are sorted by `order` ASC. Callers rely on this for
  // conflict resolution in RuleService.executeRulesForHome.
  getHomeRules(homeId: string): Promise<Rule[]>;
  getRule(ruleId: string): Promise<Rule>;
  findHomeRuleSet(homeId: string): Promise<HomeRuleSet>;
  deleteRule(ruleId: string): Promise<void>;
  reorderRules(
    homeId: string,
    positions: { id: string; order: number }[],
  ): Promise<void>;
}
