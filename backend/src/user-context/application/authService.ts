import { AuthInboundPort } from "./authInboundPort";
import { UserRepository } from "../domain/userRepository";
import jwt from "jsonwebtoken";

export class AuthService implements AuthInboundPort {
  constructor(private userRepository: UserRepository) {}

  async login(
    houseId: string,
    username: string,
    password: string,
  ): Promise<string> {
    const user = await this.userRepository.findByUsernameAndHouseId(
      houseId,
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
      houseId: user.houseId,
      username: user.username,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    return token;
  }
}
