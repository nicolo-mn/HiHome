import { Role } from "./Role";

export class User {
  private _notificationPreferences: string[];

  constructor(
    public readonly id: string,
    public readonly homeId: string,
    public readonly username: string,
    private _password: string,
    private _role: Role,
    notificationPreferences: readonly string[] = [],
  ) {
    this._notificationPreferences = [...notificationPreferences];
  }

  get role(): Role {
    return this._role;
  }

  get password(): string {
    return this._password;
  }

  get notificationPreferences(): readonly string[] {
    return this._notificationPreferences;
  }

  changeRoleTo(
    newRole: Role,
    actor: User,
    otherAdminsInHome: readonly User[],
  ): void {
    this.assertActorCanManage(actor);
    const isDemotionFromAdmin = this._role.isAdmin() && !newRole.isAdmin();
    if (isDemotionFromAdmin && otherAdminsInHome.length === 0) {
      throw new Error("At least one Admin must remain in the home");
    }
    this._role = newRole;
  }

  updateNotificationPreferences(types: readonly string[]): void {
    this._notificationPreferences = [...types];
  }

  private assertActorCanManage(actor: User): void {
    if (!actor._role.isAdmin()) {
      throw new Error("Only Admin can assign roles");
    }
    if (actor.id === this.id) {
      throw new Error("Admin cannot change their own role");
    }
    if (actor.homeId !== this.homeId) {
      throw new Error("Admin cannot manage users of another home");
    }
  }
}
