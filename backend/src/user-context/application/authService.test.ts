import "dotenv/config";
import { describe, it, expect, vi } from "vitest";
import { AuthService } from "./authService";
import { UserRepository } from "../domain/userRepository";
import { StandardUser } from "../domain/entities";
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
      findByUsernameAndHouseId: vi.fn().mockResolvedValue(mockUser),
    };

    const authService = new AuthService(mockUserRepository);

    const result = await authService.login("house1", "johndoe", "password123");

    expect(typeof result).toBe("string");
    const decoded = jwt.decode(result) as any;
    expect(decoded.houseId).toBe("house1");
    expect(decoded.username).toBe("johndoe");
    expect(mockUserRepository.findByUsernameAndHouseId).toHaveBeenCalledWith(
      "house1",
      "johndoe",
    );
    expect(mockUserRepository.findByUsernameAndHouseId).toHaveBeenCalledTimes(
      1,
    );
  });

  it("should throw an error if the user is not found", async () => {
    const mockUserRepository: UserRepository = {
      findByUsernameAndHouseId: vi.fn().mockResolvedValue(null),
    };

    const authService = new AuthService(mockUserRepository);

    await expect(
      authService.login("house1", "unknown_user", "password123"),
    ).rejects.toThrow("User not found");
    expect(mockUserRepository.findByUsernameAndHouseId).toHaveBeenCalledWith(
      "house1",
      "unknown_user",
    );
  });
});
