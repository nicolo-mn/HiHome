import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import type { Request, Response } from "express";
import { NotificationInboundPort } from "../../application/ports/NotificationInboundPort";
import { NotificationController } from "./NotificationController";

const createResponse = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response;

const makeRequest = (id = "home-1", username = "alice"): Request =>
  ({ params: { id }, user: { username } }) as unknown as Request;

describe("NotificationController.getNotifications", () => {
  let port: { listByUser: Mock<NotificationInboundPort["listByUser"]> };
  let controller: NotificationController;

  beforeEach(() => {
    port = { listByUser: vi.fn<NotificationInboundPort["listByUser"]>() };
    controller = new NotificationController(
      port as unknown as NotificationInboundPort,
    );
  });

  it("returns the notifications for the authenticated user", async () => {
    const notifications = [{ id: "n1" }] as never;
    port.listByUser.mockResolvedValue(notifications);
    const res = createResponse();

    await controller.getNotifications(makeRequest("home-1", "alice"), res);

    expect(port.listByUser).toHaveBeenCalledWith("home-1", "alice");
    expect(res.json).toHaveBeenCalledWith({ notifications });
  });

  it("returns 404 when the port throws", async () => {
    port.listByUser.mockRejectedValue(new Error("boom"));
    const res = createResponse();

    await controller.getNotifications(makeRequest(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "boom" });
  });
});
