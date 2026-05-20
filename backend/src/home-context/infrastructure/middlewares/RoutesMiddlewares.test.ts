import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authMiddleware, homeIdMiddleware } from "./RoutesMiddlewares";
import { verifyAuthToken } from "../../../utils/JwtUtils";

vi.mock("../../../utils/JwtUtils", () => ({
  verifyAuthToken: vi.fn(),
}));

type TestRequest = Request & {
  headers: { authorization?: string };
  params: { id?: string };
  user?: { homeId?: string; [key: string]: unknown };
};

const createRequest = (overrides?: Partial<TestRequest>): TestRequest =>
  ({
    headers: {},
    params: {},
    ...overrides,
  }) as TestRequest;

const createResponse = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

describe("authMiddleware", () => {
  const verifyAuthTokenMock = vi.mocked(verifyAuthToken);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts Bearer token and attaches user", async () => {
    const req = createRequest({
      headers: { authorization: "Bearer token-123" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;
    const decoded = { userId: "user-1", homeId: "1" };
    verifyAuthTokenMock.mockReturnValue(decoded);

    await authMiddleware(req, res, next);

    expect(verifyAuthTokenMock).toHaveBeenCalledWith("token-123");
    expect((req as any).user).toEqual(decoded);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects missing Authorization header", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Missing or invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid Authorization prefix", async () => {
    const req = createRequest({
      headers: { authorization: "Token token-123" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Missing or invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid token", async () => {
    const req = createRequest({
      headers: { authorization: "Bearer bad-token" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;
    verifyAuthTokenMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized: Invalid token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("homeIdMiddleware", () => {
  it("rejects missing homeId", async () => {
    const req = createRequest({ params: {} });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await homeIdMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Bad Request: Missing homeId parameter",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects homeId mismatch", async () => {
    const req = createRequest({ params: { id: "2" } });
    req.user = { homeId: "1" };
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await homeIdMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden: Access to this house is denied",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts matching homeId", async () => {
    const req = createRequest({ params: { id: "1" } });
    req.user = { homeId: "1" };
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await homeIdMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
