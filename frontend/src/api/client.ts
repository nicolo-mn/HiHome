import {
  ApiError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
} from "./errors";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  auth?: boolean;
}

const DEFAULT_TIMEOUT_MS = 10_000;

type UnauthorizedHandler = () => void | Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function getAuthToken(): string | null {
  return localStorage.getItem("jwt");
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return await res.text();
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  if (typeof body === "string" && body.length > 0) return body;
  return fallback;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    auth = true,
    headers,
    signal,
    ...rest
  } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort());
  }

  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new TimeoutError(timeoutMs);
    }
    throw new NetworkError("Network request failed", err);
  } finally {
    window.clearTimeout(timeoutId);
  }

  const parsed = await parseBody(res);

  if (!res.ok) {
    if (res.status === 401) {
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
      throw new UnauthorizedError(
        extractErrorMessage(parsed, "Unauthorized"),
        parsed,
      );
    }
    throw new ApiError(
      res.status,
      extractErrorMessage(parsed, res.statusText || "Request failed"),
      parsed,
    );
  }

  return parsed as T;
}
