import { Role } from "../../domain/Role";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";
import {
  PreferencesRepository,
  UserPrefsRecord,
  ALL_NOTIFICATION_TYPES,
} from "../../domain/PreferencesRepository";

export class InMemoryUserRepository
  implements UserRepository, PreferencesRepository
{
  private users: User[] = [
    new User("1", "1", "mockuser", "mockpassword", Role.standard(), [
      ...ALL_NOTIFICATION_TYPES,
    ]),
    new User("2", "1", "adminuser", "mockpassword", Role.admin(), [
      ...ALL_NOTIFICATION_TYPES,
    ]),
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

  async findAllByHome(homeId: string): Promise<UserPrefsRecord[]> {
    return this.users
      .filter((u) => u.homeId === homeId)
      .map((u) => ({
        username: u.username,
        role: u.role.name,
        notificationPreferences:
          u.notificationPreferences.length > 0
            ? [...u.notificationPreferences]
            : [...ALL_NOTIFICATION_TYPES],
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
    return user.notificationPreferences.length > 0
      ? [...user.notificationPreferences]
      : [...ALL_NOTIFICATION_TYPES];
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
      user.updateNotificationPreferences(types);
    }
  }
}
