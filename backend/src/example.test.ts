import { describe, it, expect } from "vitest";
import { User } from "./user-context/domain/user";

describe("User Domain Entity", () => {
  it("should allow access to a home the user belongs to", () => {
    const user = new User("alice", ["home-1", "home-2"]);
    expect(user.canAccessHome("home-1")).toBe(true);
    expect(user.canAccessHome("home-2")).toBe(true);
  });

  it("should deny access to a home the user does not belong to", () => {
    const user = new User("bob", ["home-1"]);
    expect(user.canAccessHome("home-2")).toBe(false);
    expect(user.canAccessHome("home-999")).toBe(false);
  });

  it("should deny access when user has no homes", () => {
    const user = new User("nobody", []);
    expect(user.canAccessHome("home-1")).toBe(false);
  });
});
