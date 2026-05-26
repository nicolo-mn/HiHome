export interface UserPreferencesPort {
  getEnabledUsernamesForType(
    homeId: string,
    notificationType: string,
  ): Promise<string[]>;
}
