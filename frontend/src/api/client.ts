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

type TokenProvider = () => string | null;
let tokenProvider: TokenProvider = () => null;

export function setAuthTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
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
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.length > 0) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message.length > 0) {
      return record.message;
    }
  }
  if (typeof body === "string" && body.length > 0) {
    const trimmed = body.trim();
    // Upstream proxies (nginx, Cloudflare) return HTML error pages on 5xx —
    // showing them verbatim leaks markup into the UI. Fall back instead.
    if (trimmed.startsWith("<") || /<html[\s>]/i.test(trimmed)) {
      return fallback;
    }
    return trimmed;
  }
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

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = tokenProvider();
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
    signal?.removeEventListener("abort", onExternalAbort);
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
