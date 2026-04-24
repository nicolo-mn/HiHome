import jwt from "jsonwebtoken";
import { UserRepository } from "../domain/user-repository";

export class LoginService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(
    username: string,
    homeId: string,
  ): Promise<{ token: string } | { error: string }> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return { error: "User not found" };
    }

    if (!user.canAccessHome(homeId)) {
      return { error: "User does not have access to this home" };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({ username, homeId }, secret, {
      expiresIn: "24h",
    });

    return { token };
  }
}
