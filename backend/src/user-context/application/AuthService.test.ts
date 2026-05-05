import "dotenv/config";
import { describe, it, expect, vi } from "vitest";
import { AuthService } from "./AuthService";
import { UserRepository } from "../domain/UserRepository";
import { StandardUser } from "../domain/Entities";
import jwt from "jsonwebtoken";

describe("AuthService", () => {
  it("should successfully log in a valid user and return a JWT token", async () => {
    const mockUser = new StandardUser(
      "1",
      "house1",
      "johndoe",
      "hashed_password",
    );

    const mockUserRepository: UserRepository = {
      findByUsernameAndHomeId: vi.fn().mockResolvedValue(mockUser),
    };

    const authService = new AuthService(mockUserRepository);

    const result = await authService.login("house1", "johndoe", "password123");

    expect(typeof result).toBe("string");
    const decoded = jwt.decode(result) as any;
    expect(decoded.homeId).toBe("house1");
    expect(decoded.username).toBe("johndoe");
    expect(mockUserRepository.findByUsernameAndHomeId).toHaveBeenCalledWith(
      "house1",
      "johndoe",
    );
    expect(mockUserRepository.findByUsernameAndHomeId).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if the user is not found", async () => {
    const mockUserRepository: UserRepository = {
      findByUsernameAndHomeId: vi.fn().mockResolvedValue(null),
    };

    const authService = new AuthService(mockUserRepository);

    await expect(
      authService.login("house1", "unknown_user", "password123"),
    ).rejects.toThrow("User not found");
    expect(mockUserRepository.findByUsernameAndHomeId).toHaveBeenCalledWith(
      "house1",
      "unknown_user",
    );
  });
});
