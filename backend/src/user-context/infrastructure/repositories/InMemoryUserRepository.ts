import { Role } from "../../domain/Role";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [
    new User("1", "1", "mockuser", "mockpassword", Role.standard()),
    new User("2", "1", "adminuser", "mockpassword", Role.admin()),
  ];

  async findByUsernameAndHomeId(
    homeId: string,
    username: string,
  ): Promise<User | null> {
    return (
      this.users.find((u) => u.username === username && u.homeId === homeId) ||
      null
    );
  }

  async findById(userId: string): Promise<User | null> {
    return this.users.find((u) => u.id === userId) || null;
  }

  async findAdminsByHome(homeId: string): Promise<User[]> {
    return this.users.filter((u) => u.homeId === homeId && u.role.isAdmin());
  }

  async listUsersOfHome(homeId: string): Promise<User[]> {
    return this.users.filter((u) => u.homeId === homeId);
  }

  async save(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index === -1) {
      this.users.push(user);
    } else {
      this.users[index] = user;
    }
  }
}
