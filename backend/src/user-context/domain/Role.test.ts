import { describe, it, expect } from "vitest";
import { Role } from "./Role";

describe("Role", () => {
  it("parses valid role names", () => {
    expect(Role.parse("Admin").isAdmin()).toBe(true);
    expect(Role.parse("StandardUser").isAdmin()).toBe(false);
  });

  it("rejects unknown strings", () => {
    expect(() => Role.parse("Viewer")).toThrow(/Invalid role/);
  });

  it("rejects non-string input", () => {
    expect(() => Role.parse(undefined)).toThrow(/Invalid role/);
    expect(() => Role.parse(42)).toThrow(/Invalid role/);
    expect(() => Role.parse(null)).toThrow(/Invalid role/);
  });

  it("error message lists the allowed roles", () => {
    try {
      Role.parse("Nope");
      throw new Error("expected to throw");
    } catch (e: any) {
      expect(e.message).toContain("Admin");
      expect(e.message).toContain("StandardUser");
    }
  });

  it("equals compares by name", () => {
    expect(Role.admin().equals(Role.admin())).toBe(true);
    expect(Role.admin().equals(Role.standard())).toBe(false);
  });
});
