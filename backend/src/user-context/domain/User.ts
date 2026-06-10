import { Role } from "./Role";

export class User {
  constructor(
    public readonly id: string,
    public readonly homeId: string,
    public readonly username: string,
    private _password: string,
    private _role: Role,
  ) {}

  get role(): Role {
    return this._role;
  }

  get password(): string {
    return this._password;
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
