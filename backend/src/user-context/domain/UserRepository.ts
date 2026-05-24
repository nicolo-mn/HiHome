import { User } from "./Entities";

export interface UserRepository {
  findByUsernameAndHomeId(
    homeId: string,
    username: string,
  ): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  findAdminsByHome(homeId: string): Promise<User[]>;
  listUsersOfHome(homeId: string): Promise<User[]>;
  save(user: User): Promise<void>;
}
