import { User } from "../../../domain/model/entities";
import { UserRepository } from "../../../domain/repository/userRepository";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [
    // Your hardcoded mock user goes here
    {
      id: "1",
      username: "mockuser",
      password: "mockpassword",
      houseId: "house1",
    },
  ];

  async findByUsernameAndHouseId(
    houseId: string,
    username: string,
  ): Promise<User | null> {
    console.log(
      `Searching for user with username: ${username} and houseId: ${houseId}`,
    );
    console.log(`Current users in repository: ${JSON.stringify(this.users)}`);
    console.log(
      `Equals ${this.users[0].username === username} and ${this.users[0].houseId === houseId}`,
    );
    return (
      this.users.find(
        (u) => u.username === username && u.houseId === houseId,
      ) || null
    );
  }
}
