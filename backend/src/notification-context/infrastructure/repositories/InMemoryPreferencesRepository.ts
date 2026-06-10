import { PreferencesRepository } from "../../domain/PreferencesRepository";

export class InMemoryPreferencesRepository implements PreferencesRepository {
  private preferences = new Map<string, string[]>();

  private keyOf(homeId: string, username: string): string {
    return `${homeId}:${username}`;
  }

  async findByUser(homeId: string, username: string): Promise<string[] | null> {
    const prefs = this.preferences.get(this.keyOf(homeId, username));
    return prefs ? [...prefs] : null;
  }

  async update(
    homeId: string,
    username: string,
    types: string[],
  ): Promise<void> {
    this.preferences.set(this.keyOf(homeId, username), [...types]);
  }
}
