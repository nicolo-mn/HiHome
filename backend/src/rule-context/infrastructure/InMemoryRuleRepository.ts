import { ObservableCondition } from "../domain/Observables";
import { ComponentAction } from "../domain/Actions";
import { RuleRepository } from "../application/RuleRepository";
import { Rule } from "../domain/Rule";

export class InMemoryRuleRepository implements RuleRepository {
  private rules: Map<string, Rule[]> = new Map();
  private nextId = 1;

  async getHomeRules(homeId: string): Promise<Rule[]> {
    const homeRules = this.rules.get(homeId) || [];
    return [...homeRules].sort((a, b) => a.order - b.order);
  }

  async addRule(
    homeId: string,
    name: string,
    condition: ObservableCondition,
    actions: ComponentAction[],
  ): Promise<Rule> {
    if (actions.length === 0)
      throw new Error("A rule must have at least one action");
    // TODO: persist a counter in final MongoDB implementation
    const newId = String(this.nextId++);
    const homeRules = this.rules.get(homeId) || [];
    const maxOrder = homeRules.reduce((m, r) => Math.max(m, r.order), 0);
    const newRule: Rule = {
      id: newId,
      homeId,
      name,
      order: maxOrder + 1,
      condition,
      actions,
    };
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

  async reorderRules(homeId: string, orderedIds: string[]): Promise<Rule[]> {
    const homeRules = this.rules.get(homeId) || [];
    const existingIds = new Set(homeRules.map((r) => r.id));
    const requestedIds = new Set(orderedIds);

    if (
      existingIds.size !== requestedIds.size ||
      [...existingIds].some((id) => !requestedIds.has(id))
    ) {
      throw new Error(
        "Reorder list must contain exactly the rules of the home",
      );
    }

    const reordered = orderedIds.map((id, idx) => {
      const rule = homeRules.find((r) => r.id === id)!;
      return { ...rule, order: idx + 1 };
    });
    this.rules.set(homeId, reordered);
    return [...reordered];
  }
}
