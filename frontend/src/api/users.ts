import { apiFetch } from "./client";

export type RoleName = "Admin" | "StandardUser";

export const ALL_ROLES: readonly RoleName[] = ["Admin", "StandardUser"];

export const ROLE_LABELS: Record<RoleName, string> = {
  Admin: "Admin",
  StandardUser: "Standard User",
};

export interface UserSummary {
  id: string;
  username: string;
  role: RoleName;
}

export async function getUsers(homeId: string): Promise<UserSummary[]> {
  const data = await apiFetch<{ users: UserSummary[] }>(
    `/api/v1/home/${encodeURIComponent(homeId)}/users`,
  );
  return data.users;
}

export async function changeRole(
  homeId: string,
  userId: string,
  role: RoleName,
): Promise<UserSummary> {
  const data = await apiFetch<{ user: UserSummary }>(
    `/api/v1/home/${encodeURIComponent(homeId)}/users/${encodeURIComponent(userId)}/role`,
    { method: "PUT", body: { role } },
  );
  return data.user;
}
