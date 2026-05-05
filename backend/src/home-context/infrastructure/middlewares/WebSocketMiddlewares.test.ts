import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Socket } from "socket.io";
import { wsAuthMiddleware, wsHomeIdMiddleware } from "./WebSocketMiddlewares";
import { verifyAuthToken } from "../../../utils/JwtUtils";

vi.mock("../../../utils/JwtUtils", () => ({
  verifyAuthToken: vi.fn(),
}));

type TestSocket = Socket & {
  handshake: {
    auth: { token?: string };
    headers: { authorization?: string };
    query: { homeId?: string };
  };
  user?: { homeId?: string; [key: string]: unknown };
};

const createSocket = (
  handshakeOverrides?: Partial<TestSocket["handshake"]>,
): TestSocket =>
  ({
    handshake: {
      auth: {},
      headers: {},
      query: {},
      ...handshakeOverrides,
    },
  }) as TestSocket;

describe("wsAuthMiddleware", () => {
  const verifyAuthTokenMock = vi.mocked(verifyAuthToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses Bearer token from handshake.auth", () => {
    const socket = createSocket({ auth: { token: "Bearer token-123" } });
    const next = vi.fn();
    const decoded = { userId: "user-1", homeId: "1" };
    verifyAuthTokenMock.mockReturnValue(decoded);

    wsAuthMiddleware(socket, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect((socket as any).user).toEqual(decoded);
    expect(next).toHaveBeenCalledWith();
  });

  it("uses raw token from headers when no Bearer prefix", () => {
    const socket = createSocket({
      headers: { authorization: "raw-token" },
    });
    const next = vi.fn();
    const decoded = { userId: "user-2", homeId: "1" };
    verifyAuthTokenMock.mockReturnValue(decoded);

    wsAuthMiddleware(socket, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("raw-token");
    expect((socket as any).user).toEqual(decoded);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects missing token", () => {
    const socket = createSocket();
    const next = vi.fn();

    wsAuthMiddleware(socket, next);

    const error = next.mock.calls[0]?.[0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Unauthorized: Missing token");
  });

  it("rejects invalid token", () => {
    const socket = createSocket({ auth: { token: "Bearer bad-token" } });
    const next = vi.fn();
    verifyAuthTokenMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    wsAuthMiddleware(socket, next);

    const error = next.mock.calls[0]?.[0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Unauthorized: Invalid token");
  });
});

describe("wsHomeIdMiddleware", () => {
  it("rejects homeId mismatch", () => {
    const socket = createSocket({ query: { homeId: "2" } });
    (socket as any).user = { homeId: "1" };
    const next = vi.fn();

    wsHomeIdMiddleware(socket, next);

    const error = next.mock.calls[0]?.[0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Forbidden: Access to this house is denied");
  });

  it("accepts matching homeId", () => {
    const socket = createSocket({ query: { homeId: "1" } });
    (socket as any).user = { homeId: "1" };
    const next = vi.fn();

    wsHomeIdMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith();
  });
});
