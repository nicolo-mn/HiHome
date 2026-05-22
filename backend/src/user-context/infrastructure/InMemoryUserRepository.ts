import { Role, User } from "../domain/Entities";
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
    // Your hardcoded mock user goes here
    new User("1", "1", "mockuser", "mockpassword", Role.Operator, [...ALL_NOTIFICATION_TYPES]),
    new User("2", "1", "adminuser", "mockpassword", Role.Admin, [...ALL_NOTIFICATION_TYPES]),
    new User("3", "1", "vieweruser", "mockpassword", Role.Viewer, [...ALL_NOTIFICATION_TYPES]),
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
