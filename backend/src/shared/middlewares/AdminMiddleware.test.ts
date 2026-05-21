import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { adminMiddleware } from "./AdminMiddleware";
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

describe("adminMiddleware", () => {
  const verifyAuthTokenMock = vi.mocked(verifyAuthToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing Authorization header", () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    adminMiddleware(req, res, next);

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

    adminMiddleware(req, res, next);

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

    adminMiddleware(req, res, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("bad-token");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects non-admin role", () => {
    const req = createRequest({
      headers: { authorization: "Bearer token-123" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;
    verifyAuthTokenMock.mockReturnValue({ role: "StandardUser" });

    adminMiddleware(req, res, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Admin access required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts admin token and attaches user", () => {
    const req = createRequest({
      headers: { authorization: "Bearer token-123" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;
    const decoded = { role: "Admin", userId: "user-1" };
    verifyAuthTokenMock.mockReturnValue(decoded);

    adminMiddleware(req, res, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect((req as any).user).toEqual(decoded);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
