import { UserPreferencesPort } from "../../notification-context/application/UserPreferencesPort";
import {
  PreferencesRepository,
  ALL_NOTIFICATION_TYPES,
} from "../domain/PreferencesRepository";

export class UserPreferencesAdapter implements UserPreferencesPort {
  constructor(private prefsRepo: PreferencesRepository) {}

  async getEnabledUsernamesForType(
    homeId: string,
    notificationType: string,
  ): Promise<string[]> {
    const users = await this.prefsRepo.findAllByHome(homeId);
    return users
      .filter((u) =>
        (u.notificationPreferences ?? [...ALL_NOTIFICATION_TYPES]).includes(
          notificationType,
        ),
      )
      .map((u) => u.username);
  }
}
