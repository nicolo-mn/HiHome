import { User } from "./Entities";

export interface UserRepository {
  findByUsernameAndHouseId(
    houseId: string,
    username: string,
  ): Promise<User | null>;
}
