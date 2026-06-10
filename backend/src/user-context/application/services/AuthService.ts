import { AuthInboundPort } from "../ports/AuthInboundPort";
import { PasswordHasherPort } from "../ports/PasswordHasherPort";
import { UserRepository } from "../../domain/UserRepository";
import jwt from "jsonwebtoken";

export class AuthService implements AuthInboundPort {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasherPort,
  ) {}

  async login(
    homeId: string,
    username: string,
    password: string,
  ): Promise<string> {
    const user = await this.userRepository.findByUsernameAndHomeId(
      homeId,
      username,
    );

    const isPasswordValid = user
      ? await this.passwordHasher.compare(password, user.passwordHash)
      : false;

    if (!user || !isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const payload = {
      homeId: user.homeId,
      username: user.username,
      role: user.role.name,
    };

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    return token;
  }
}
