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
});
