import { describe, expect, it } from "vitest";
import { InMemoryRuleRepository } from "./InMemoryRuleRepository";
import { RuleFactory } from "../domain/RuleFactory";

describe("InMemoryRuleRepository", () => {
  it("does not reuse rule ids after deletion", async () => {
    const repo = new InMemoryRuleRepository();
    const trigger = RuleFactory.createTrigger("sensor-1", "gt", 10);
    const actions = [
      RuleFactory.createAction("component-1", "capability-1", "command-1"),
    ];

    const first = await repo.addRule("home-1", "First", trigger, actions);
    const second = await repo.addRule("home-1", "Second", trigger, actions);
    await repo.deleteRule(first.id);
    const third = await repo.addRule("home-1", "Third", trigger, actions);

    expect(third.id).not.toBe(first.id);
    expect(third.id).not.toBe(second.id);
  });
});
