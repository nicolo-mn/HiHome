import "dotenv/config";
import { describe, it, expect, vi } from "vitest";
import { AuthService } from "./AuthService";
import { PasswordHasherPort } from "../ports/PasswordHasherPort";
import { UserRepository } from "../../domain/UserRepository";
import { Role } from "../../domain/Role";
import { User } from "../../domain/User";
import jwt from "jsonwebtoken";

const fakePasswordHasher: PasswordHasherPort = {
  hash: async (plain) => `hashed:${plain}`,
  compare: async (plain, hash) => hash === `hashed:${plain}`,
};

describe("AuthService", () => {
  it("should successfully log in a valid user and return a JWT token", async () => {
    const mockUser = new User(
      "1",
      "1",
      "johndoe",
      "hashed:password123",
      Role.standard(),
    );

    const mockUserRepository: UserRepository = {
      findByUsernameAndHomeId: vi.fn().mockResolvedValue(mockUser),
      findById: vi.fn(),
      findAdminsByHome: vi.fn(),
      listUsersOfHome: vi.fn(),
      save: vi.fn(),
    };

    const authService = new AuthService(mockUserRepository, fakePasswordHasher);

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
      listUsersOfHome: vi.fn(),
      save: vi.fn(),
    };

    const authService = new AuthService(mockUserRepository, fakePasswordHasher);

    await expect(
      authService.login("1", "unknown_user", "password123"),
    ).rejects.toThrow("Invalid credentials");
    expect(mockUserRepository.findByUsernameAndHomeId).toHaveBeenCalledWith(
      "1",
      "unknown_user",
    );
  });

  it("should throw an error if the password is wrong", async () => {
    const mockUser = new User(
      "1",
      "1",
      "johndoe",
      "hashed:password123",
      Role.standard(),
    );

    const mockUserRepository: UserRepository = {
      findByUsernameAndHomeId: vi.fn().mockResolvedValue(mockUser),
      findById: vi.fn(),
      findAdminsByHome: vi.fn(),
      listUsersOfHome: vi.fn(),
      save: vi.fn(),
    };

    const authService = new AuthService(mockUserRepository, fakePasswordHasher);

    await expect(
      authService.login("1", "johndoe", "wrong_password"),
    ).rejects.toThrow("Invalid credentials");
  });
});
