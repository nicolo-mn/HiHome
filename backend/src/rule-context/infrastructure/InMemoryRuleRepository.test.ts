import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRuleRepository } from "./InMemoryRuleRepository";
import { ObservableCondition } from "../domain/Observables";
import { ComponentAction } from "../domain/Actions";
import { RuleRepository } from "../application/RuleRepository";

describe("RuleRepository", () => {
  let repository: RuleRepository;

  beforeEach(() => {
    repository = new InMemoryRuleRepository();
  });

  it("should return empty array for home without rules", async () => {
    const rules = await repository.getHomeRules("home-1");
    expect(rules).toEqual([]);
  });

  it("should raise an error when attempting to add a rule without actions", async () => {
    const mockCondition = {} as ObservableCondition;
    const mockActions: ComponentAction[] = [];

    await expect(
      repository.addRule("home-1", "Rule 1", mockCondition, mockActions),
    ).rejects.toThrow("A rule must have at least one action");
  });

  it("should add a rule and retrieve it", async () => {
    const mockCondition = {} as ObservableCondition;
    const mockActions: ComponentAction[] = [{} as ComponentAction];

    const rule = await repository.addRule(
      "home-1",
      "Rule 1",
      mockCondition,
      mockActions,
    );

    expect(rule.id).toBe("1");
    expect(rule.homeId).toBe("home-1");
    expect(rule.name).toBe("Rule 1");
    expect(rule.condition).toBe(mockCondition);
    expect(rule.actions).toBe(mockActions);

    const rules = await repository.getHomeRules("home-1");
    expect(rules).toHaveLength(1);
    expect(rules[0]).toBe(rule);
  });

  it("should generate sequential IDs", async () => {
    const rule1 = await repository.addRule("home-1", "Rule 1", {} as any, [
      {} as any,
    ]);
    const rule2 = await repository.addRule("home-1", "Rule 2", {} as any, [
      {} as any,
    ]);

    expect(rule1.id).toBe("1");
    expect(rule2.id).toBe("2");
  });

  it("should delete a rule", async () => {
    const rule = await repository.addRule("home-1", "Rule 1", {} as any, [
      {} as any,
    ]);

    let rules = await repository.getHomeRules("home-1");
    expect(rules).toHaveLength(1);

    await repository.deleteRule(rule.id);

    rules = await repository.getHomeRules("home-1");
    expect(rules).toHaveLength(0);
  });

  it("should throw error when deleting non-existent rule", async () => {
    await expect(repository.deleteRule("non-existent")).rejects.toThrow(
      "Rule not found",
    );
  });

  it("should assign incremental order per home on add", async () => {
    const r1 = await repository.addRule("home-1", "R1", {} as any, [{} as any]);
    const r2 = await repository.addRule("home-1", "R2", {} as any, [{} as any]);
    const r3 = await repository.addRule("home-2", "R3", {} as any, [{} as any]);

    expect(r1.order).toBe(1);
    expect(r2.order).toBe(2);
    expect(r3.order).toBe(1);
  });

  it("should return rules sorted by order", async () => {
    const r1 = await repository.addRule("home-1", "R1", {} as any, [{} as any]);
    const r2 = await repository.addRule("home-1", "R2", {} as any, [{} as any]);
    const r3 = await repository.addRule("home-1", "R3", {} as any, [{} as any]);

    await repository.reorderRules("home-1", [r3.id, r1.id, r2.id]);

    const rules = await repository.getHomeRules("home-1");
    expect(rules.map((r) => r.id)).toEqual([r3.id, r1.id, r2.id]);
    expect(rules.map((r) => r.order)).toEqual([1, 2, 3]);
  });

  it("should leave gaps in order when a rule is deleted", async () => {
    const r1 = await repository.addRule("home-1", "R1", {} as any, [{} as any]);
    const r2 = await repository.addRule("home-1", "R2", {} as any, [{} as any]);
    const r3 = await repository.addRule("home-1", "R3", {} as any, [{} as any]);

    await repository.deleteRule(r2.id);

    const rules = await repository.getHomeRules("home-1");
    expect(rules.map((r) => r.id)).toEqual([r1.id, r3.id]);
    expect(rules.map((r) => r.order)).toEqual([1, 3]);
  });

  it("should reject reorder when ids do not match the home rules exactly", async () => {
    const r1 = await repository.addRule("home-1", "R1", {} as any, [{} as any]);
    const r2 = await repository.addRule("home-1", "R2", {} as any, [{} as any]);

    await expect(repository.reorderRules("home-1", [r1.id])).rejects.toThrow(
      "Reorder list must contain exactly the rules of the home",
    );

    await expect(
      repository.reorderRules("home-1", [r1.id, r2.id, "extra-id"]),
    ).rejects.toThrow(
      "Reorder list must contain exactly the rules of the home",
    );

    await expect(
      repository.reorderRules("home-1", [r1.id, "wrong-id"]),
    ).rejects.toThrow(
      "Reorder list must contain exactly the rules of the home",
    );
  });
});
