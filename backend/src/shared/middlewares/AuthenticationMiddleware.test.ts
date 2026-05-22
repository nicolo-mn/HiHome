import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authenticationMiddleware } from "./AuthenticationMiddleware";
import { verifyAuthToken } from "../../utils/JwtUtils";

vi.mock("../../utils/JwtUtils", () => ({
  verifyAuthToken: vi.fn(),
}));

type TestRequest = Request & {
  headers: { authorization?: string };
  user?: { role?: string; [key: string]: unknown };
};

const createRequest = (overrides?: Partial<TestRequest>): TestRequest =>
  ({
    headers: {},
    ...overrides,
  }) as TestRequest;

const createResponse = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

describe("authenticationMiddleware", () => {
  const verifyAuthTokenMock = vi.mocked(verifyAuthToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing Authorization header", () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    authenticationMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Missing or invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid Authorization prefix", () => {
    const req = createRequest({
      headers: { authorization: "Token token-123" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    authenticationMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Missing or invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects Bearer header without token", () => {
    const req = createRequest({
      headers: { authorization: "Bearer " },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    authenticationMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Missing or invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid token", () => {
    const req = createRequest({
      headers: { authorization: "Bearer bad-token" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;
    verifyAuthTokenMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    authenticationMiddleware(req, res, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("bad-token");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches decoded user and calls next regardless of role", () => {
    const req = createRequest({
      headers: { authorization: "Bearer token-123" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;
    const decoded = {
      role: "Viewer",
      username: "viewer",
      homeId: "1",
    };
    verifyAuthTokenMock.mockReturnValue(decoded);

    authenticationMiddleware(req, res, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect((req as any).user).toEqual(decoded);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
