import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Mock } from "vitest";
import { Notification } from "../../domain/Notification";
import { NotificationDeliveryPort } from "../../domain/NotificationDeliveryPort";
import { InMemoryNotificationRepository } from "../../infrastructure/repositories/InMemoryNotificationRepository";
import { NotificationPolicy } from "../NotificationPolicy";
import { UserPreferencesPort } from "../ports/UserPreferencesPort";
import {
  DeviceActionEvent,
  RulesExecutedEvent,
  SensorUpdateEvent,
} from "../ports/NotificationInboundPort";
import { NotificationService } from "./NotificationService";

const THRESHOLD = 50;

const makeService = (recipients: string[] = ["alice"]) => {
  const repository = new InMemoryNotificationRepository();
  const deliveryPort: {
    send: Mock<NotificationDeliveryPort["send"]>;
  } = { send: vi.fn<NotificationDeliveryPort["send"]>() };
  const policy: NotificationPolicy = {
    getAirQualityThreshold: () => THRESHOLD,
    isAirQualitySensor: (sensorType) => sensorType === "air-quality",
  };
  const userPreferencesPort: {
    getEnabledUsernamesForType: Mock<
      UserPreferencesPort["getEnabledUsernamesForType"]
    >;
  } = {
    getEnabledUsernamesForType: vi
      .fn<UserPreferencesPort["getEnabledUsernamesForType"]>()
      .mockResolvedValue(recipients),
  };
  const service = new NotificationService(
    repository,
    deliveryPort,
    policy,
    userPreferencesPort,
  );
  return { service, repository, deliveryPort, userPreferencesPort };
};

const airQualityUpdate = (
  value: SensorUpdateEvent["value"],
): SensorUpdateEvent => ({
  sensorType: "air-quality",
  value,
  measureUnit: "AQI",
});

describe("NotificationService.listByUser", () => {
  it("maps domain notifications to DTOs with an ISO createdAt", async () => {
    const { service, repository } = makeService();
    const createdAt = new Date("2026-01-01T10:00:00.000Z");
    await repository.add(
      new Notification(
        "n1",
        "home-1",
        "DeviceAction",
        "hello",
        "alice",
        createdAt,
        false,
      ),
    );

    const dtos = await service.listByUser("home-1", "alice");

    expect(dtos).toEqual([
      {
        id: "n1",
        homeId: "home-1",
        type: "DeviceAction",
        message: "hello",
        createdAt: createdAt.toISOString(),
        read: false,
        details: undefined,
      },
    ]);
  });
});

describe("NotificationService.notifyDeviceAction", () => {
  const event = (
    overrides: Partial<DeviceActionEvent> = {},
  ): DeviceActionEvent => ({
    deviceId: "d1",
    deviceName: "Lamp",
    action: "turnOn",
    actor: { username: "bob", role: "Standard" },
    ...overrides,
  });

  it("ignores actions performed by an Admin", async () => {
    const { service, deliveryPort, userPreferencesPort } = makeService();

    await service.notifyDeviceAction(
      "home-1",
      event({ actor: { username: "admin", role: "Admin" } }),
    );

    expect(deliveryPort.send).not.toHaveBeenCalled();
    expect(
      userPreferencesPort.getEnabledUsernamesForType,
    ).not.toHaveBeenCalled();
  });

  it("stores and delivers a DeviceAction notification for non-admins", async () => {
    const { service, repository, deliveryPort } = makeService();

    await service.notifyDeviceAction("home-1", event());

    const stored = await repository.listByUser("home-1", "alice");
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe("DeviceAction");
    expect(stored[0].message).toBe("bob performed turnOn on Lamp.");
    expect(deliveryPort.send).toHaveBeenCalledWith(stored[0], ["alice"]);
  });

  it("excludes the actor from the list of recipients", async () => {
    const { service, repository, deliveryPort } = makeService(["alice", "bob"]);

    await service.notifyDeviceAction(
      "home-1",
      event({ actor: { username: "bob", role: "Standard" } }),
    );

    const storedBob = await repository.listByUser("home-1", "bob");
    expect(storedBob).toHaveLength(0);

    const storedAlice = await repository.listByUser("home-1", "alice");
    expect(storedAlice).toHaveLength(1);
    expect(storedAlice[0].message).toBe("bob performed turnOn on Lamp.");
    expect(deliveryPort.send).toHaveBeenCalledWith(storedAlice[0], ["alice"]);
    expect(deliveryPort.send).not.toHaveBeenCalledWith(expect.any(Object), [
      "bob",
    ]);
  });

  it("falls back to the device id when no device name is present", async () => {
    const { service, repository } = makeService();

    await service.notifyDeviceAction(
      "home-1",
      event({ deviceName: undefined }),
    );

    const [stored] = await repository.listByUser("home-1", "alice");
    expect(stored.message).toBe("bob performed turnOn on d1.");
  });
});

describe("NotificationService.notifyRulesExecuted", () => {
  it("ignores an empty execution list", async () => {
    const { service, deliveryPort } = makeService();

    await service.notifyRulesExecuted("home-1", { executions: [] });

    expect(deliveryPort.send).not.toHaveBeenCalled();
  });

  it("stores and delivers an AutomationRuleExecuted notification with details", async () => {
    const { service, repository, deliveryPort } = makeService();
    const event: RulesExecutedEvent = {
      executions: [{ ruleName: "Cool down", actions: ["turn on fan"] }],
    };

    await service.notifyRulesExecuted("home-1", event);

    const [stored] = await repository.listByUser("home-1", "alice");
    expect(stored.type).toBe("AutomationRuleExecuted");
    expect(stored.details).toEqual({ executions: event.executions });
    expect(deliveryPort.send).toHaveBeenCalledWith(stored, ["alice"]);
  });
});

describe("NotificationService.notifySensorUpdate", () => {
  it("ignores non-air-quality sensors", async () => {
    const { service, deliveryPort } = makeService();

    await service.notifySensorUpdate("home-1", {
      sensorType: "temperature",
      value: 99,
      measureUnit: "C",
    });

    expect(deliveryPort.send).not.toHaveBeenCalled();
  });

  it.each([
    ["equal to the threshold", THRESHOLD],
    ["below the threshold", THRESHOLD - 10],
  ])("ignores an AQI %s", async (_label, value) => {
    const { service, deliveryPort } = makeService();

    await service.notifySensorUpdate("home-1", airQualityUpdate(value));

    expect(deliveryPort.send).not.toHaveBeenCalled();
  });

  it("notifies when the AQI exceeds the threshold and there is no recent breach", async () => {
    const { service, repository, deliveryPort } = makeService();

    await service.notifySensorUpdate(
      "home-1",
      airQualityUpdate(THRESHOLD + 30),
    );

    const [stored] = await repository.listByUser("home-1", "alice");
    expect(stored.type).toBe("AirQualityThresholdBreach");
    expect(stored.message).toContain(`(${THRESHOLD})`);
    expect(deliveryPort.send).toHaveBeenCalledTimes(1);
  });

  it("suppresses a breach when one was recorded less than an hour ago", async () => {
    const { service, repository, deliveryPort } = makeService();
    await repository.add(
      new Notification(
        "recent",
        "home-1",
        "AirQualityThresholdBreach",
        "earlier",
        "alice",
        new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      ),
    );

    await service.notifySensorUpdate(
      "home-1",
      airQualityUpdate(THRESHOLD + 30),
    );

    expect(deliveryPort.send).not.toHaveBeenCalled();
  });

  it("notifies again when the previous breach is older than an hour", async () => {
    const { service, repository, deliveryPort } = makeService();
    await repository.add(
      new Notification(
        "old",
        "home-1",
        "AirQualityThresholdBreach",
        "earlier",
        "alice",
        new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      ),
    );

    await service.notifySensorUpdate(
      "home-1",
      airQualityUpdate(THRESHOLD + 30),
    );

    expect(deliveryPort.send).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["aqi field", { aqi: THRESHOLD + 30 }],
    ["airQuality field", { airQuality: THRESHOLD + 30 }],
  ])(
    "extracts a numeric AQI from a record with an %s",
    async (_label, value) => {
      const { service, deliveryPort } = makeService();

      await service.notifySensorUpdate(
        "home-1",
        airQualityUpdate(value as unknown as SensorUpdateEvent["value"]),
      );

      expect(deliveryPort.send).toHaveBeenCalledTimes(1);
    },
  );

  it("ignores a record with no numeric AQI", async () => {
    const { service, deliveryPort } = makeService();

    await service.notifySensorUpdate(
      "home-1",
      airQualityUpdate({ foo: "bar" } as unknown as SensorUpdateEvent["value"]),
    );

    expect(deliveryPort.send).not.toHaveBeenCalled();
  });
});

describe("NotificationService storeAndDeliver fan-out", () => {
  it("stores and delivers one notification per enabled recipient", async () => {
    const { service, repository, deliveryPort } = makeService(["alice", "bob"]);

    await service.notifyDeviceAction("home-1", {
      deviceId: "d1",
      deviceName: "Lamp",
      action: "turnOn",
      actor: { username: "carol", role: "Standard" },
    });

    expect(await repository.listByUser("home-1", "alice")).toHaveLength(1);
    expect(await repository.listByUser("home-1", "bob")).toHaveLength(1);
    expect(deliveryPort.send).toHaveBeenCalledTimes(2);
    const recipientArgs = deliveryPort.send.mock.calls.map((c) => c[1]);
    expect(recipientArgs).toEqual([["alice"], ["bob"]]);
  });

  it("delivers nothing when there are no enabled recipients", async () => {
    const { service, repository, deliveryPort } = makeService([]);

    await service.notifyDeviceAction("home-1", {
      deviceId: "d1",
      deviceName: "Lamp",
      action: "turnOn",
      actor: { username: "carol", role: "Standard" },
    });

    expect(await repository.listByUser("home-1", "alice")).toHaveLength(0);
    expect(deliveryPort.send).not.toHaveBeenCalled();
  });
});
