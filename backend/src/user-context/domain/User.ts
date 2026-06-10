import { Role } from "./Role";

export class User {
  constructor(
    public readonly id: string,
    public readonly homeId: string,
    public readonly username: string,
    private _passwordHash: string,
    private _role: Role,
  ) {}

  get role(): Role {
    return this._role;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  changeRoleTo(
    newRole: Role,
    actor: User,
    hasOtherAdminsInHome: boolean,
  ): void {
    this.assertActorCanManage(actor);
    const isDemotionFromAdmin = this._role.isAdmin() && !newRole.isAdmin();
    if (isDemotionFromAdmin && !hasOtherAdminsInHome) {
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
