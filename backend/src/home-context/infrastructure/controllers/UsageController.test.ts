import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
import { UsageService } from "../../application/services/UsageService";
import { UsageController } from "./UsageController";

const createResponse = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

const makeRequest = (range?: string, id = "1"): Request =>
  ({
    params: { id },
    query: range === undefined ? {} : { range },
  }) as unknown as Request;

describe("UsageController", () => {
  let usageService: { getUsage: ReturnType<typeof vi.fn> };
  let controller: UsageController;

  beforeEach(() => {
    usageService = { getUsage: vi.fn().mockResolvedValue({ report: "ok" }) };
    controller = new UsageController(usageService as unknown as UsageService);
  });

  it.each([
    ["week", 7],
    ["month", 30],
    [undefined, 7],
  ])("maps range=%s to %i days and returns the report", async (range, days) => {
    const res = createResponse();

    await controller.getUsage(makeRequest(range), res);

    expect(usageService.getUsage).toHaveBeenCalledWith("1", days);
    expect(res.json).toHaveBeenCalledWith({ report: "ok" });
  });

  it("returns 400 for an unsupported range", async () => {
    const res = createResponse();

    await controller.getUsage(makeRequest("year"), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "range must be week or month",
    });
    expect(usageService.getUsage).not.toHaveBeenCalled();
  });

  it("returns 404 when the service throws", async () => {
    usageService.getUsage.mockRejectedValue(new Error("Home 1 not found"));
    const res = createResponse();

    await controller.getUsage(makeRequest("week"), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Home 1 not found" });
  });
});
