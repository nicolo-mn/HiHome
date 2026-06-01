import { describe, it, expect, beforeEach } from "vitest";
import { Notification, NotificationType } from "../../domain/Notification";
import { InMemoryNotificationRepository } from "./InMemoryNotificationRepository";

const notif = (
  id: string,
  homeId: string,
  username: string,
  type: NotificationType = "DeviceAction",
  createdAt = new Date(),
): Notification =>
  new Notification(id, homeId, type, `msg-${id}`, username, createdAt);

describe("InMemoryNotificationRepository", () => {
  let repo: InMemoryNotificationRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationRepository();
  });

  describe("listByUser", () => {
    it("returns only the matching home/user, newest first", async () => {
      await repo.add(notif("1", "home-1", "alice"));
      await repo.add(notif("2", "home-1", "alice"));
      await repo.add(notif("3", "home-1", "bob")); // other user
      await repo.add(notif("4", "home-2", "alice")); // other home

      const result = await repo.listByUser("home-1", "alice");

      expect(result.map((n) => n.id)).toEqual(["2", "1"]);
    });

    it("returns an empty array when nothing matches", async () => {
      await repo.add(notif("1", "home-1", "alice"));
      expect(await repo.listByUser("home-9", "nobody")).toEqual([]);
    });
  });

  describe("findLatestByHomeAndType", () => {
    it("returns the most recent notification of the given home and type", async () => {
      await repo.add(
        notif(
          "old",
          "home-1",
          "alice",
          "AirQualityThresholdBreach",
          new Date(1000),
        ),
      );
      await repo.add(
        notif(
          "new",
          "home-1",
          "bob",
          "AirQualityThresholdBreach",
          new Date(3000),
        ),
      );
      await repo.add(
        notif(
          "mid",
          "home-1",
          "alice",
          "AirQualityThresholdBreach",
          new Date(2000),
        ),
      );
      await repo.add(
        notif("other", "home-1", "alice", "DeviceAction", new Date(9000)),
      );

      const latest = await repo.findLatestByHomeAndType(
        "home-1",
        "AirQualityThresholdBreach",
      );

      expect(latest?.id).toBe("new");
    });

    it("returns null when no notification matches", async () => {
      await repo.add(notif("1", "home-1", "alice", "DeviceAction"));
      expect(
        await repo.findLatestByHomeAndType(
          "home-1",
          "AirQualityThresholdBreach",
        ),
      ).toBeNull();
    });
  });
});
