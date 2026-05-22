export enum Role {
  Admin = "Admin",
  Operator = "Operator",
  Viewer = "Viewer",
}

export function parseRole(value: string): Role {
  const known = Object.values(Role) as string[];
  if (!known.includes(value)) {
    throw new Error(`Unknown role: ${value}`);
  }
  return value as Role;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly homeId: string,
    public readonly username: string,
    public password: string,
    public readonly role: Role,
    public notificationPreferences?: string[],
  ) {}
}
