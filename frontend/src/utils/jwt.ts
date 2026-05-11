export interface JwtPayload {
  username?: string;
  homeId?: string;
  exp?: number;
}

export function decodeJwt(jwt: string | null): JwtPayload | null {
  if (!jwt) return null;
  try {
    const parsed = JSON.parse(atob(jwt.split(".")[1] ?? ""));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as JwtPayload)
      : null;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
