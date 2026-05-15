export interface JwtPayload {
  username?: string;
  homeId?: string;
  exp?: number;
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const binary = atob(normalized + "=".repeat(padding));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwt(jwt: string | null): JwtPayload | null {
  if (!jwt) return null;
  try {
    const payloadPart = jwt.split(".")[1];
    if (!payloadPart) return null;
    const parsed = JSON.parse(base64UrlDecode(payloadPart));
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
