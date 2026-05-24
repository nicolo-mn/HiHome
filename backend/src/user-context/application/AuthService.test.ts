import "dotenv/config";
import { describe, it, expect, vi } from "vitest";
import { AuthService } from "./AuthService";
import { UserRepository } from "../domain/UserRepository";
import { StandardUser } from "../domain/Entities";
import jwt from "jsonwebtoken";

describe("AuthService", () => {
  it("should successfully log in a valid user and return a JWT token", async () => {
    const mockUser = new StandardUser("1", "1", "johndoe", "hashed_password");

    const mockUserRepository: UserRepository = {
      findByUsernameAndHomeId: vi.fn().mockResolvedValue(mockUser),
      findById: vi.fn(),
      findAdminsByHome: vi.fn(),
      save: vi.fn(),
    };

    const authService = new AuthService(mockUserRepository);

    const result = await authService.login("1", "johndoe", "password123");

    expect(typeof result).toBe("string");
    const decoded = jwt.decode(result) as any;
    expect(decoded.homeId).toBe("1");
    expect(decoded.username).toBe("johndoe");
    expect(mockUserRepository.findByUsernameAndHomeId).toHaveBeenCalledWith(
      "1",
      "johndoe",
    );
    expect(mockUserRepository.findByUsernameAndHomeId).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if the user is not found", async () => {
    const mockUserRepository: UserRepository = {
      findByUsernameAndHomeId: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAdminsByHome: vi.fn(),
      save: vi.fn(),
    };

    const authService = new AuthService(mockUserRepository);

    await expect(
      authService.login("1", "unknown_user", "password123"),
    ).rejects.toThrow("User not found");
    expect(mockUserRepository.findByUsernameAndHomeId).toHaveBeenCalledWith(
      "1",
      "unknown_user",
    );
  });
});
