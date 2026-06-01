import { describe, it, expect } from "vitest";
import { Notification } from "./Notification";

describe("Notification", () => {
  it("applies constructor defaults for read, details and createdAt", () => {
    const before = Date.now();
    const n = new Notification(
      "n1",
      "home-1",
      "DeviceAction",
      "hello",
      "alice",
    );

    expect(n.read).toBe(false);
    expect(n.details).toBeUndefined();
    expect(n.createdAt).toBeInstanceOf(Date);
    expect(n.createdAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("markRead flips read to true", () => {
    const n = new Notification(
      "n1",
      "home-1",
      "DeviceAction",
      "hello",
      "alice",
    );
    expect(n.read).toBe(false);

    n.markRead();

    expect(n.read).toBe(true);
  });
});
