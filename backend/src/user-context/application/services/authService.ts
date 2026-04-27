import { AuthInboundPort } from "../ports/authInboundPort";
import { UserRepository } from "../../domain/repository/userRepository";

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

    // TODO: placeholder for JWT generation
    return "success";
  }
}
