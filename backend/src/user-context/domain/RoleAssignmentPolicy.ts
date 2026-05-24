import { User } from "./Entities";

export type RoleName = "Admin" | "StandardUser";

export const ALL_ROLES: readonly RoleName[] = ["Admin", "StandardUser"];

export function parseRole(value: unknown): RoleName {
  if (
    typeof value !== "string" ||
    !(ALL_ROLES as readonly string[]).includes(value)
  ) {
    throw new Error(`Invalid role: must be one of ${ALL_ROLES.join(", ")}`);
  }
  return value as RoleName;
}

export class RoleAssignmentPolicy {
  static assertCanAssign(
    actor: User,
    target: User,
    newRole: RoleName,
    adminsInHome: User[],
  ): void {
    if (actor.role !== "Admin") {
      throw new Error("Only Admin can assign roles");
    }
    if (actor.id === target.id) {
      throw new Error("Admin cannot change their own role");
    }
    if (actor.homeId !== target.homeId) {
      throw new Error("Admin cannot manage users of another home");
    }

    const targetWasAdmin = target.role === "Admin";
    const targetWillBeAdmin = newRole === "Admin";
    if (targetWasAdmin && !targetWillBeAdmin) {
      const remainingAdmins = adminsInHome.filter(
        (u) => u.id !== target.id,
      ).length;
      if (remainingAdmins < 1) {
        throw new Error("At least one Admin must remain in the home");
      }
    }
  }
}
