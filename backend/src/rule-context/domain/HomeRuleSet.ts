import { Rule } from "./Rule";

// Aggregate root for the ordered set of rules of a home.
// Owns the invariants: each rule's `order` is unique and contiguous from 0.
export class HomeRuleSet {
  private _rules: Rule[];

  private constructor(
    public readonly homeId: string,
    rules: Rule[],
  ) {
    this._rules = [...rules].sort((a, b) => a.order - b.order);
  }

  static fromPersisted(homeId: string, rules: Rule[]): HomeRuleSet {
    return new HomeRuleSet(homeId, rules);
  }

  static empty(homeId: string): HomeRuleSet {
    return new HomeRuleSet(homeId, []);
  }

  get rules(): readonly Rule[] {
    return this._rules;
  }

  nextOrder(): number {
    return this._rules.length;
  }

  remove(ruleId: string): void {
    const index = this._rules.findIndex((r) => r.id === ruleId);
    if (index === -1) {
      throw new Error("Rule not found");
    }
    this._rules.splice(index, 1);
    this._rules = this._rules.map((r, i) => ({ ...r, order: i }));
  }

  reorder(orderedRuleIds: string[]): void {
    if (orderedRuleIds.length !== this._rules.length) {
      throw new Error(
        "Reorder must include every rule of the home exactly once",
      );
    }
    if (new Set(orderedRuleIds).size !== orderedRuleIds.length) {
      throw new Error("Reorder must not contain duplicate rule ids");
    }
    const byId = new Map(this._rules.map((r) => [r.id, r]));
    const reordered: Rule[] = [];
    for (let i = 0; i < orderedRuleIds.length; i++) {
      const rule = byId.get(orderedRuleIds[i]);
      if (!rule) {
        throw new Error(
          `Rule ${orderedRuleIds[i]} does not belong to home ${this.homeId}`,
        );
      }
      reordered.push({ ...rule, order: i });
    }
    this._rules = reordered;
  }

  positions(): { id: string; order: number }[] {
    return this._rules.map((r) => ({ id: r.id, order: r.order }));
  }
}
