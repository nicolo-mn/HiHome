import { User } from "./entities";

export interface UserRepository {
  findByUsernameAndHouseId(
    houseId: string,
    username: string,
  ): Promise<User | null>;
}
