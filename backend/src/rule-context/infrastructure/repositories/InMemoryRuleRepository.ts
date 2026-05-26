import { ObservableCondition } from "../../domain/Observables";
import { ComponentAction } from "../../domain/Actions";
import { RuleRepository } from "../../application/repositories/RuleRepository";
import { Rule } from "../../domain/Rule";
import { HomeRuleSet } from "../../domain/HomeRuleSet";

export class InMemoryRuleRepository implements RuleRepository {
  private rules: Map<string, Rule[]> = new Map();
  private nextId = 1;

  async getHomeRules(homeId: string): Promise<Rule[]> {
    const list = this.rules.get(homeId) ?? [];
    return [...list].sort((a, b) => a.order - b.order);
  }

  async getRule(ruleId: string): Promise<Rule> {
    for (const homeRules of this.rules.values()) {
      const rule = homeRules.find((r) => r.id === ruleId);
      if (rule) return rule;
    }
    throw new Error("Rule not found");
  }

  async findHomeRuleSet(homeId: string): Promise<HomeRuleSet> {
    const rules = await this.getHomeRules(homeId);
    return HomeRuleSet.fromPersisted(homeId, rules);
  }

  async addRule(
    homeId: string,
    name: string,
    condition: ObservableCondition,
    actions: ComponentAction[],
    order: number,
  ): Promise<Rule> {
    if (actions.length === 0)
      throw new Error("A rule must have at least one action");
    const newId = String(this.nextId++);
    const newRule: Rule = {
      id: newId,
      homeId,
      name,
      order,
      condition,
      actions,
    };
    const homeRules = this.rules.get(homeId) ?? [];
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

  async reorderRules(
    homeId: string,
    positions: { id: string; order: number }[],
  ): Promise<void> {
    const homeRules = this.rules.get(homeId);
    if (!homeRules) return;
    const orderById = new Map(positions.map((p) => [p.id, p.order]));
    for (const rule of homeRules) {
      const newOrder = orderById.get(rule.id);
      if (newOrder !== undefined) rule.order = newOrder;
    }
  }
}
