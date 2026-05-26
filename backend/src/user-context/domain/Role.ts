export type RoleName = "Admin" | "StandardUser";

const ALL_ROLES: readonly RoleName[] = ["Admin", "StandardUser"];

export class Role {
  private constructor(public readonly name: RoleName) {}

  static admin(): Role {
    return new Role("Admin");
  }

  static standard(): Role {
    return new Role("StandardUser");
  }

  static parse(value: unknown): Role {
    if (
      typeof value !== "string" ||
      !(ALL_ROLES as readonly string[]).includes(value)
    ) {
      throw new Error(`Invalid role: must be one of ${ALL_ROLES.join(", ")}`);
    }
    return new Role(value as RoleName);
  }

  isAdmin(): boolean {
    return this.name === "Admin";
  }

  equals(other: Role): boolean {
    return this.name === other.name;
  }
}
