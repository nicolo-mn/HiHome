import { describe, it, expect } from "vitest";
import { StandardUser, Admin } from "./entities";

describe("User Entities", () => {
  describe("StandardUser", () => {
    it("should instantiate correctly with valid properties", () => {
      const user = new StandardUser("u1", "h1", "testuser", "securepass");

      expect(user.id).toBe("u1");
      expect(user.houseId).toBe("h1");
      expect(user.username).toBe("testuser");
      expect(user.password).toBe("securepass");
    });
  });

  describe("Admin", () => {
    it("should instantiate correctly with valid properties", () => {
      const admin = new Admin("a1", "h1", "adminuser", "adminpass");

      expect(admin.id).toBe("a1");
      expect(admin.houseId).toBe("h1");
      expect(admin.username).toBe("adminuser");
      expect(admin.password).toBe("adminpass");
    });
  });
});
