export interface PreferencesRepository {
  findByUser(homeId: string, username: string): Promise<string[] | null>;
  update(homeId: string, username: string, types: string[]): Promise<void>;
}
