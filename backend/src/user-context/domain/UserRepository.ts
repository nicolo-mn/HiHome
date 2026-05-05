import { User } from "./Entities";

export interface UserRepository {
  findByUsernameAndHomeId(
    homeId: string,
    username: string,
  ): Promise<User | null>;
}
