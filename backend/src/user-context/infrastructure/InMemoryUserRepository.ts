import { User } from "../domain/Entities";
import { UserRepository } from "../domain/UserRepository";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [
    // Your hardcoded mock user goes here
    {
      id: "1",
      username: "mockuser",
      password: "mockpassword",
      houseId: "1",
      role: "StandardUser",
    },
  ];

  async findByUsernameAndHouseId(
    houseId: string,
    username: string,
  ): Promise<User | null> {
    console.log(
      `Searching for user with username: ${username} and houseId: ${houseId}`,
    );
    return (
      this.users.find(
        (u) => u.username === username && u.houseId === houseId,
      ) || null
    );
  }
}
