import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRuleRepository } from "./InMemoryRuleRepository";
import { ObservableCondition } from "../../domain/Observables";
import { DeviceAction } from "../../domain/Actions";
import { RuleRepository } from "../../application/repositories/RuleRepository";

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
    const mockActions: DeviceAction[] = [];

    await expect(
      repository.addRule("home-1", "Rule 1", mockCondition, mockActions, 0),
    ).rejects.toThrow("A rule must have at least one action");
  });

  it("should add a rule and retrieve it", async () => {
    const mockCondition = {} as ObservableCondition;
    const mockActions: DeviceAction[] = [{} as DeviceAction];

    const rule = await repository.addRule(
      "home-1",
      "Rule 1",
      mockCondition,
      mockActions,
      0,
    );

    expect(rule.id).toBe("1");
    expect(rule.homeId).toBe("home-1");
    expect(rule.name).toBe("Rule 1");
    expect(rule.order).toBe(0);
    expect(rule.condition).toBe(mockCondition);
    expect(rule.actions).toBe(mockActions);

    const rules = await repository.getHomeRules("home-1");
    expect(rules).toHaveLength(1);
    expect(rules[0]).toBe(rule);
  });

  it("should generate sequential IDs", async () => {
    const rule1 = await repository.addRule(
      "home-1",
      "Rule 1",
      {} as any,
      [{} as any],
      0,
    );
    const rule2 = await repository.addRule(
      "home-1",
      "Rule 2",
      {} as any,
      [{} as any],
      1,
    );

    expect(rule1.id).toBe("1");
    expect(rule2.id).toBe("2");
  });

  it("should return rules sorted by order ASC", async () => {
    await repository.addRule("home-1", "A", {} as any, [{} as any], 2);
    await repository.addRule("home-1", "B", {} as any, [{} as any], 0);
    await repository.addRule("home-1", "C", {} as any, [{} as any], 1);

    const rules = await repository.getHomeRules("home-1");

    expect(rules.map((r) => r.name)).toEqual(["B", "C", "A"]);
  });

  it("should delete a rule", async () => {
    const rule = await repository.addRule(
      "home-1",
      "Rule 1",
      {} as any,
      [{} as any],
      0,
    );

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

  it("should get a rule by id", async () => {
    const rule = await repository.addRule(
      "home-1",
      "Rule 1",
      {} as any,
      [{} as any],
      0,
    );

    const fetched = await repository.getRule(rule.id);
    expect(fetched.id).toBe(rule.id);
    expect(fetched.homeId).toBe("home-1");
  });

  it("should throw when getting non-existent rule", async () => {
    await expect(repository.getRule("missing")).rejects.toThrow(
      "Rule not found",
    );
  });

  it("should expose a HomeRuleSet sorted by order", async () => {
    await repository.addRule("home-1", "A", {} as any, [{} as any], 2);
    await repository.addRule("home-1", "B", {} as any, [{} as any], 0);
    await repository.addRule("home-1", "C", {} as any, [{} as any], 1);

    const ruleSet = await repository.findHomeRuleSet("home-1");

    expect(ruleSet.rules.map((r) => r.name)).toEqual(["B", "C", "A"]);
  });

  it("should reorder rules through bulk positions", async () => {
    const r1 = await repository.addRule(
      "home-1",
      "A",
      {} as any,
      [{} as any],
      0,
    );
    const r2 = await repository.addRule(
      "home-1",
      "B",
      {} as any,
      [{} as any],
      1,
    );
    const r3 = await repository.addRule(
      "home-1",
      "C",
      {} as any,
      [{} as any],
      2,
    );

    await repository.reorderRules("home-1", [
      { id: r3.id, order: 0 },
      { id: r1.id, order: 1 },
      { id: r2.id, order: 2 },
    ]);

    const rules = await repository.getHomeRules("home-1");
    expect(rules.map((r) => r.name)).toEqual(["C", "A", "B"]);
  });
});
