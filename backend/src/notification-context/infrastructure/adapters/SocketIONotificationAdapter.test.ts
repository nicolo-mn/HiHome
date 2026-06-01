import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Server } from "socket.io";
import { Notification } from "../../domain/Notification";
import { SocketIONotificationPort } from "./SocketIONotificationAdapter";

describe("SocketIONotificationPort.send", () => {
  let emit: ReturnType<typeof vi.fn>;
  let to: ReturnType<typeof vi.fn>;
  let port: SocketIONotificationPort;

  const notification = new Notification(
    "n1",
    "home-1",
    "DeviceAction",
    "hello",
    "alice",
    new Date("2026-01-01T10:00:00.000Z"),
    false,
  );

  beforeEach(() => {
    emit = vi.fn();
    to = vi.fn(() => ({ emit }));
    port = new SocketIONotificationPort({ to } as unknown as Server);
  });

  it("emits to each user's room when recipients are provided", () => {
    port.send(notification, ["alice", "bob"]);

    expect(to).toHaveBeenCalledTimes(2);
    expect(to).toHaveBeenNthCalledWith(1, "user-alice");
    expect(to).toHaveBeenNthCalledWith(2, "user-bob");
    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledWith(
      "notification",
      expect.objectContaining({ id: "n1", homeId: "home-1" }),
    );
  });

  it("broadcasts to the home room when no recipients are provided", () => {
    port.send(notification);

    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith("home-home-1");
    expect(emit).toHaveBeenCalledWith(
      "notification",
      expect.objectContaining({ homeId: "home-1" }),
    );
  });

  it("serializes createdAt to an ISO string in the payload", () => {
    port.send(notification);

    const payload = emit.mock.calls[0][1];
    expect(payload.createdAt).toBe("2026-01-01T10:00:00.000Z");
  });
});
