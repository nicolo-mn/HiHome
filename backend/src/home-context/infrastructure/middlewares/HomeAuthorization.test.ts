import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { canActuateComponents, canManageComponents } from "./HomeAuthorization";
import { verifyAuthToken } from "../../../utils/JwtUtils";
import { Role } from "../../../user-context/domain/Entities";

vi.mock("../../../utils/JwtUtils", () => ({
  verifyAuthToken: vi.fn(),
}));

type TestRequest = Request & {
  headers: { authorization?: string };
  user?: { role?: string; [key: string]: unknown };
};

const createRequest = (role?: Role): TestRequest =>
  ({
    headers: { authorization: "Bearer token-123" },
  }) as TestRequest;

const createResponse = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

const mockDecodedRole = (role: Role) => {
  vi.mocked(verifyAuthToken).mockReturnValue({ role });
};

describe("canManageComponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows Admin", () => {
    mockDecodedRole(Role.Admin);
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    canManageComponents(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects Operator", () => {
    mockDecodedRole(Role.Operator);
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    canManageComponents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects Viewer", () => {
    mockDecodedRole(Role.Viewer);
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    canManageComponents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects requests without a valid token", () => {
    const req = { headers: {} } as TestRequest;
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    canManageComponents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("canActuateComponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows Admin", () => {
    mockDecodedRole(Role.Admin);
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    canActuateComponents(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows Operator", () => {
    mockDecodedRole(Role.Operator);
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    canActuateComponents(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects Viewer", () => {
    mockDecodedRole(Role.Viewer);
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    canActuateComponents(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
