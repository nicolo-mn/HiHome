import { describe, it, expect } from "vitest";
import {
  ALL_ROLES,
  RoleAssignmentPolicy,
  RoleName,
  parseRole,
} from "./RoleAssignmentPolicy";
import { User } from "./Entities";

const userOf = (
  id: string,
  role: string,
  homeId = "home-1",
  username = `u-${id}`,
): User => ({
  id,
  homeId,
  username,
  password: "pwd",
  role,
});

const ADMIN: RoleName = "Admin";
const STANDARD: RoleName = "StandardUser";

describe("RoleAssignmentPolicy", () => {
  it("allows an Admin to promote a StandardUser", () => {
    const admin = userOf("a1", "Admin");
    const target = userOf("u1", "StandardUser");
    expect(() =>
      RoleAssignmentPolicy.assertCanAssign(admin, target, ADMIN, [admin]),
    ).not.toThrow();
  });

  it("allows an Admin to demote another Admin when other Admins remain", () => {
    const a1 = userOf("a1", "Admin");
    const a2 = userOf("a2", "Admin");
    expect(() =>
      RoleAssignmentPolicy.assertCanAssign(a1, a2, STANDARD, [a1, a2]),
    ).not.toThrow();
  });

  it("rejects when actor is not Admin", () => {
    const su = userOf("u1", "StandardUser");
    const target = userOf("u2", "StandardUser");
    expect(() =>
      RoleAssignmentPolicy.assertCanAssign(su, target, ADMIN, [
        userOf("a1", "Admin"),
      ]),
    ).toThrow(/Only Admin/);
  });

  it("rejects self-change", () => {
    const admin = userOf("a1", "Admin");
    const a1Bis = userOf("a1", "Admin");
    expect(() =>
      RoleAssignmentPolicy.assertCanAssign(admin, a1Bis, STANDARD, [admin]),
    ).toThrow(/own role/);
  });

  it("rejects cross-home assignment", () => {
    const admin = userOf("a1", "Admin", "home-A");
    const target = userOf("u1", "StandardUser", "home-B");
    expect(() =>
      RoleAssignmentPolicy.assertCanAssign(admin, target, ADMIN, [admin]),
    ).toThrow(/another home/);
  });

  it("rejects demoting the only remaining Admin in the home", () => {
    const actor = userOf("a1", "Admin");
    const target = userOf("a2", "Admin");
    expect(() =>
      RoleAssignmentPolicy.assertCanAssign(actor, target, STANDARD, [target]),
    ).toThrow(/At least one Admin/);
  });

  it("does not enforce min-admin when target stays Admin", () => {
    const actor = userOf("a1", "Admin");
    const target = userOf("a2", "Admin");
    expect(() =>
      RoleAssignmentPolicy.assertCanAssign(actor, target, ADMIN, [target]),
    ).not.toThrow();
  });
});

describe("parseRole", () => {
  it("accepts every value in ALL_ROLES", () => {
    for (const r of ALL_ROLES) {
      expect(parseRole(r)).toBe(r);
    }
  });

  it("rejects an unknown string", () => {
    expect(() => parseRole("Viewer")).toThrow(/Invalid role/);
  });

  it("rejects non-string input", () => {
    expect(() => parseRole(undefined)).toThrow(/Invalid role/);
    expect(() => parseRole(42)).toThrow(/Invalid role/);
    expect(() => parseRole(null)).toThrow(/Invalid role/);
  });

  it("error message lists the allowed roles", () => {
    try {
      parseRole("Nope");
      throw new Error("expected to throw");
    } catch (e: any) {
      expect(e.message).toContain("Admin");
      expect(e.message).toContain("StandardUser");
    }
  });
});
