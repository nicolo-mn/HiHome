export class User {
  constructor(
    public readonly username: string,
    public readonly homeIds: string[],
  ) {}

  canAccessHome(homeId: string): boolean {
    return this.homeIds.includes(homeId);
  }
}
