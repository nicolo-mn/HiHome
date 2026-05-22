export const ALL_NOTIFICATION_TYPES = [
  "AirQualityThresholdBreach",
  "AutomationRuleExecuted",
  "ComponentAction",
] as const;

export type NotificationType = (typeof ALL_NOTIFICATION_TYPES)[number];

export interface UserPrefsRecord {
  username: string;
  notificationPreferences: string[];
}

export interface PreferencesRepository {
  findAllByHome(homeId: string): Promise<UserPrefsRecord[]>;
  findPreferences(homeId: string, username: string): Promise<string[] | null>;
  updatePreferences(
    homeId: string,
    username: string,
    types: string[],
  ): Promise<void>;
}
