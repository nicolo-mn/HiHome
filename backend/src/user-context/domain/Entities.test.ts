import { describe, it, expect } from "vitest";
import { Role, User } from "./Entities";

describe("User", () => {
  it("instantiates with valid properties and an Admin role", () => {
    const user = new User("a1", "h1", "adminuser", "adminpass", Role.Admin);

    expect(user.id).toBe("a1");
    expect(user.homeId).toBe("h1");
    expect(user.username).toBe("adminuser");
    expect(user.password).toBe("adminpass");
    expect(user.role).toBe(Role.Admin);
  });

  it("instantiates with an Operator role", () => {
    const user = new User("o1", "h1", "operator", "pass", Role.Operator);

    expect(user.role).toBe(Role.Operator);
  });

  it("instantiates with a Viewer role", () => {
    const user = new User("v1", "h1", "viewer", "pass", Role.Viewer);

    expect(user.role).toBe(Role.Viewer);
  });
});

describe("Role", () => {
  it("exposes Admin, Operator and Viewer", () => {
    expect(Role.Admin).toBe("Admin");
    expect(Role.Operator).toBe("Operator");
    expect(Role.Viewer).toBe("Viewer");
  });
});
