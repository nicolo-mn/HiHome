import { User } from "../domain/Entities";
import { UserRepository } from "../domain/UserRepository";
import {
  PreferencesRepository,
  UserPrefsRecord,
  ALL_NOTIFICATION_TYPES,
} from "../domain/PreferencesRepository";

export class InMemoryUserRepository
  implements UserRepository, PreferencesRepository
{
  private users: User[] = [
    {
      id: "1",
      username: "mockuser",
      password: "mockpassword",
      homeId: "1",
      role: "StandardUser",
      notificationPreferences: [...ALL_NOTIFICATION_TYPES],
    },
    {
      id: "2",
      username: "adminuser",
      password: "mockpassword",
      homeId: "1",
      role: "Admin",
      notificationPreferences: [...ALL_NOTIFICATION_TYPES],
    },
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
    return this.users.filter((u) => u.homeId === homeId && u.role === "Admin");
  }

  async save(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index === -1) {
      this.users.push(user);
    } else {
      this.users[index] = user;
    }
  }

  async findAllByHome(homeId: string): Promise<UserPrefsRecord[]> {
    return this.users
      .filter((u) => u.homeId === homeId)
      .map((u) => ({
        username: u.username,
        role: u.role,
        notificationPreferences: u.notificationPreferences ?? [
          ...ALL_NOTIFICATION_TYPES,
        ],
      }));
  }

  async findPreferences(
    homeId: string,
    username: string,
  ): Promise<string[] | null> {
    const user = this.users.find(
      (u) => u.homeId === homeId && u.username === username,
    );
    if (!user) return null;
    return user.notificationPreferences ?? [...ALL_NOTIFICATION_TYPES];
  }

  async updatePreferences(
    homeId: string,
    username: string,
    types: string[],
  ): Promise<void> {
    const user = this.users.find(
      (u) => u.homeId === homeId && u.username === username,
    );
    if (user) {
      (user as User).notificationPreferences = types;
    }
  }
}
