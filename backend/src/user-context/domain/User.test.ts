import { describe, it, expect } from "vitest";
import { Role } from "./Role";
import { User } from "./User";

const userOf = (
  id: string,
  role: Role,
  homeId = "home-1",
  username = `u-${id}`,
): User => new User(id, homeId, username, "pwd", role);

describe("User", () => {
  it("exposes immutable identity and current role", () => {
    const user = new User("u1", "h1", "alice", "secret", Role.standard());
    expect(user.id).toBe("u1");
    expect(user.homeId).toBe("h1");
    expect(user.username).toBe("alice");
    expect(user.password).toBe("secret");
    expect(user.role.isAdmin()).toBe(false);
  });

  describe("changeRoleTo", () => {
    it("promotes a StandardUser to Admin when actor is Admin in same home", () => {
      const actor = userOf("a1", Role.admin());
      const target = userOf("u1", Role.standard());
      target.changeRoleTo(Role.admin(), actor, []);
      expect(target.role.isAdmin()).toBe(true);
    });

    it("demotes another Admin when other Admins remain", () => {
      const actor = userOf("a1", Role.admin());
      const target = userOf("a2", Role.admin());
      target.changeRoleTo(Role.standard(), actor, [actor]);
      expect(target.role.isAdmin()).toBe(false);
    });

    it("demotes a StandardUser without needing other Admins", () => {
      const actor = userOf("a1", Role.admin());
      const target = userOf("u1", Role.standard());
      target.changeRoleTo(Role.standard(), actor, []);
      expect(target.role.isAdmin()).toBe(false);
    });

    it("rejects demoting the only remaining Admin", () => {
      const actor = userOf("a1", Role.admin());
      const target = userOf("a2", Role.admin());
      expect(() => target.changeRoleTo(Role.standard(), actor, [])).toThrow(
        /At least one Admin/,
      );
    });

    it("rejects when actor is not Admin", () => {
      const actor = userOf("u2", Role.standard());
      const target = userOf("u1", Role.standard());
      expect(() => target.changeRoleTo(Role.admin(), actor, [])).toThrow(
        /Only Admin/,
      );
    });

    it("rejects self-change", () => {
      const same = userOf("a1", Role.admin());
      expect(() => same.changeRoleTo(Role.standard(), same, [])).toThrow(
        /own role/,
      );
    });

    it("rejects cross-home assignment", () => {
      const actor = userOf("a1", Role.admin(), "home-A");
      const target = userOf("u1", Role.standard(), "home-B");
      expect(() => target.changeRoleTo(Role.admin(), actor, [])).toThrow(
        /another home/,
      );
    });
  });

  describe("updateNotificationPreferences", () => {
    it("replaces the stored preferences", () => {
      const user = userOf("u1", Role.standard());
      user.updateNotificationPreferences(["ComponentAction"]);
      expect(user.notificationPreferences).toEqual(["ComponentAction"]);
    });

    it("isolates the stored array from external mutation", () => {
      const user = userOf("u1", Role.standard());
      const input = ["ComponentAction"];
      user.updateNotificationPreferences(input);
      input.push("Hacked");
      expect(user.notificationPreferences).toEqual(["ComponentAction"]);
    });
  });
});
