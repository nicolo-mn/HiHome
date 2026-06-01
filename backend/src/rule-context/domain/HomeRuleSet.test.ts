import { describe, it, expect } from "vitest";
import { HomeRuleSet } from "./HomeRuleSet";
import { Rule } from "./Rule";
import { ObservableCondition } from "./Observables";
import { DeviceAction } from "./Actions";

const rule = (id: string, order: number, homeId = "home-1"): Rule => ({
  id,
  homeId,
  name: `rule-${id}`,
  order,
  condition: {} as ObservableCondition,
  actions: [] as DeviceAction[],
});

describe("HomeRuleSet", () => {
  describe("construction", () => {
    it("fromPersisted sorts the rules by order", () => {
      const set = HomeRuleSet.fromPersisted("home-1", [
        rule("c", 2),
        rule("a", 0),
        rule("b", 1),
      ]);
      expect(set.rules.map((r) => r.id)).toEqual(["a", "b", "c"]);
    });

    it("empty has no rules and a nextOrder of 0", () => {
      const set = HomeRuleSet.empty("home-1");
      expect(set.rules).toHaveLength(0);
      expect(set.nextOrder()).toBe(0);
    });

    it("nextOrder is the current rule count", () => {
      const set = HomeRuleSet.fromPersisted("home-1", [
        rule("a", 0),
        rule("b", 1),
      ]);
      expect(set.nextOrder()).toBe(2);
    });

    it("positions maps each rule to { id, order }", () => {
      const set = HomeRuleSet.fromPersisted("home-1", [
        rule("a", 0),
        rule("b", 1),
      ]);
      expect(set.positions()).toEqual([
        { id: "a", order: 0 },
        { id: "b", order: 1 },
      ]);
    });
  });

  describe("remove", () => {
    it("removes the rule and re-indexes the remaining orders from 0", () => {
      const set = HomeRuleSet.fromPersisted("home-1", [
        rule("a", 0),
        rule("b", 1),
        rule("c", 2),
      ]);

      set.remove("b");

      expect(set.positions()).toEqual([
        { id: "a", order: 0 },
        { id: "c", order: 1 },
      ]);
    });

    it("throws when the rule does not exist", () => {
      const set = HomeRuleSet.fromPersisted("home-1", [rule("a", 0)]);
      expect(() => set.remove("zzz")).toThrow("Rule not found");
    });
  });

  describe("reorder", () => {
    const build = () =>
      HomeRuleSet.fromPersisted("home-1", [
        rule("a", 0),
        rule("b", 1),
        rule("c", 2),
      ]);

    it("applies the new order, setting each rule's order to its index", () => {
      const set = build();

      set.reorder(["c", "a", "b"]);

      expect(set.positions()).toEqual([
        { id: "c", order: 0 },
        { id: "a", order: 1 },
        { id: "b", order: 2 },
      ]);
    });

    it("throws when not every rule is included exactly once", () => {
      expect(() => build().reorder(["a", "b"])).toThrow(
        "Reorder must include every rule of the home exactly once",
      );
    });

    it("throws on duplicate rule ids", () => {
      expect(() => build().reorder(["a", "a", "b"])).toThrow(
        "Reorder must not contain duplicate rule ids",
      );
    });

    it("throws when an id does not belong to the home", () => {
      expect(() => build().reorder(["a", "b", "z"])).toThrow(
        "Rule z does not belong to home home-1",
      );
    });
  });
});
