import { ALL_NOTIFICATION_TYPES } from "../../domain/Notification";
import { PreferencesRepository } from "../../domain/PreferencesRepository";
import { HomeUsersPort } from "../ports/HomeUsersPort";
import { UserPreferencesPort } from "../ports/UserPreferencesPort";

export class PreferencesService implements UserPreferencesPort {
  constructor(
    private prefsRepo: PreferencesRepository,
    private homeUsersPort: HomeUsersPort,
  ) {}

  async getPreferences(homeId: string, username: string): Promise<string[]> {
    const prefs = await this.prefsRepo.findByUser(homeId, username);
    return prefs ?? [...ALL_NOTIFICATION_TYPES];
  }

  async updatePreferences(
    homeId: string,
    username: string,
    types: string[],
  ): Promise<void> {
    await this.prefsRepo.update(homeId, username, types);
  }

  async getEnabledUsernamesForType(
    homeId: string,
    notificationType: string,
  ): Promise<string[]> {
    const users = await this.homeUsersPort.listUsersOfHome(homeId);
    const recipients: string[] = [];
    for (const user of users) {
      if (
        notificationType === "AutomationRuleExecuted" &&
        user.role !== "Admin"
      ) {
        continue;
      }
      const prefs = await this.getPreferences(homeId, user.username);
      if (prefs.includes(notificationType)) {
        recipients.push(user.username);
      }
    }
    return recipients;
  }
}
