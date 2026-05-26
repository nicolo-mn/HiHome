import {
  ApiError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
} from "@/api/errors";

export interface FriendlyError {
  title: string;
  detail: string;
  hint?: string;
}

function failedTitle(action: string | undefined, fallback: string): string {
  return action ? `Couldn't ${action}` : fallback;
}

function cleanBackendMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  const trimmed = message.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("<") || /<html[\s>]/i.test(trimmed)) return undefined;
  return trimmed;
}

export function humanizeError(err: unknown, action?: string): FriendlyError {
  if (err instanceof UnauthorizedError) {
    return {
      title: "Your session expired",
      detail: "You've been signed out for security.",
      hint: "Please sign in again to continue.",
    };
  }

  if (err instanceof TimeoutError) {
    return {
      title: failedTitle(action, "Request timed out"),
      detail: `The server didn't respond within ${Math.round(err.timeoutMs / 1000)}s.`,
      hint: "Check your connection and try again.",
    };
  }

  if (err instanceof NetworkError) {
    return {
      title: failedTitle(action, "Can't reach the server"),
      detail: "Your device may be offline or the server is unreachable.",
      hint: "Check your connection and try again.",
    };
  }

  if (err instanceof ApiError) {
    const backendMessage = cleanBackendMessage(err.message);

    if (err.status >= 500) {
      return {
        title: failedTitle(action, "Something went wrong on our side"),
        detail: `The server is having trouble (status ${err.status}).`,
        hint: "Please try again in a moment.",
      };
    }
    if (err.status === 403) {
      return {
        title: failedTitle(action, "You don't have permission"),
        detail: backendMessage ?? "This action requires a different role.",
        hint: "Ask an admin to grant you access.",
      };
    }
    if (err.status === 404) {
      return {
        title: failedTitle(action, "We couldn't find that"),
        detail: backendMessage ?? "The item no longer exists.",
        hint: "It may have been removed. Try refreshing.",
      };
    }
    if (err.status === 400) {
      return {
        title: failedTitle(action, "Check the highlighted fields"),
        detail: backendMessage ?? "Some of the data is invalid.",
        hint: "Fix the values and try again.",
      };
    }
    return {
      title: failedTitle(action, "Request failed"),
      detail: backendMessage ?? `Server returned ${err.status}.`,
    };
  }

  if (err instanceof Error && err.message) {
    return {
      title: failedTitle(action, "Something went wrong"),
      detail: err.message,
    };
  }

  return {
    title: failedTitle(action, "Something went wrong"),
    detail: "An unexpected error occurred.",
    hint: "Please try again.",
  };
}

export function humanizeErrorMessage(err: unknown, action?: string): string {
  const f = humanizeError(err, action);
  return f.hint
    ? `${f.title}. ${f.detail} ${f.hint}`
    : `${f.title}. ${f.detail}`;
}
