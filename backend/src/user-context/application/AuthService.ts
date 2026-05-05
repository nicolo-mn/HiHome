import { AuthInboundPort } from "./AuthInboundPort";
import { UserRepository } from "../domain/UserRepository";
import jwt from "jsonwebtoken";

export class AuthService implements AuthInboundPort {
  constructor(private userRepository: UserRepository) {}

  async login(
    homeId: string,
    username: string,
    password: string,
  ): Promise<string> {
    const user = await this.userRepository.findByUsernameAndHomeId(
      homeId,
      username,
    );
    if (!user) {
      throw new Error("User not found");
    }

    // HACK: simulating the login for now
    const isPasswordValid = true;

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const payload = {
      homeId: user.homeId,
      username: user.username,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    return token;
  }
}
