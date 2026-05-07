import { RuleRepository } from "../application/RuleRepository";
import { Rule, RuleAction, RuleTrigger } from "../domain/Entities";
import { RuleFactory } from "../domain/RuleFactory";

export class InMemoryRuleRepository implements RuleRepository {
  private rules: Map<string, Rule[]> = new Map();
  private nextId = 1;

  async getHomeRules(homeId: string): Promise<Rule[]> {
    return this.rules.get(homeId) || [];
  }

  async addRule(
    homeId: string,
    name: string,
    trigger: RuleTrigger,
    actions: RuleAction[],
  ): Promise<Rule> {
    // TODO: persist a counter in final MongoDB implementation
    const newId = String(this.nextId++);
    const newRule: Rule = RuleFactory.createRule(
      newId,
      homeId,
      name,
      trigger,
      actions,
    );
    const homeRules = this.rules.get(homeId) || [];
    homeRules.push(newRule);
    this.rules.set(homeId, homeRules);
    return newRule;
  }

  async deleteRule(ruleId: string): Promise<void> {
    for (const [homeId, homeRules] of this.rules.entries()) {
      const index = homeRules.findIndex((rule) => rule.id === ruleId);
      if (index !== -1) {
        homeRules.splice(index, 1);
        this.rules.set(homeId, homeRules);
        return;
      }
    }
    throw new Error("Rule not found");
  }
}
