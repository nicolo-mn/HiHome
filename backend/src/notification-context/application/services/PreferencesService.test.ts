import { describe, it, expect } from "vitest";
import { PreferencesService } from "./PreferencesService";
import { ALL_NOTIFICATION_TYPES } from "../../domain/Notification";
import { InMemoryPreferencesRepository } from "../../infrastructure/repositories/InMemoryPreferencesRepository";
import { HomeUsersPort } from "../ports/HomeUsersPort";

const usersPortOf = (
  users: { username: string; role: string }[],
): HomeUsersPort => ({
  listUsersOfHome: async () => users,
});

const makeService = (users: { username: string; role: string }[] = []) => {
  const repository = new InMemoryPreferencesRepository();
  const service = new PreferencesService(repository, usersPortOf(users));
  return { service, repository };
};

describe("PreferencesService preferences management", () => {
  it("defaults to all notification types when none are stored", async () => {
    const { service } = makeService();
    const prefs = await service.getPreferences("home-1", "alice");
    expect(prefs).toEqual([...ALL_NOTIFICATION_TYPES]);
  });

  it("returns the stored preferences after an update", async () => {
    const { service } = makeService();
    await service.updatePreferences("home-1", "alice", ["DeviceAction"]);
    const prefs = await service.getPreferences("home-1", "alice");
    expect(prefs).toEqual(["DeviceAction"]);
  });

  it("keeps preferences isolated per home and user", async () => {
    const { service } = makeService();
    await service.updatePreferences("home-1", "alice", ["DeviceAction"]);
    expect(await service.getPreferences("home-2", "alice")).toEqual([
      ...ALL_NOTIFICATION_TYPES,
    ]);
    expect(await service.getPreferences("home-1", "bob")).toEqual([
      ...ALL_NOTIFICATION_TYPES,
    ]);
  });
});

describe("PreferencesService.getEnabledUsernamesForType", () => {
  const users = [
    { username: "admin-user", role: "Admin" },
    { username: "standard-user", role: "StandardUser" },
  ];

  it("restricts AutomationRuleExecuted to admins, but keeps everyone for other types", async () => {
    const { service } = makeService(users);

    expect(
      await service.getEnabledUsernamesForType(
        "home-1",
        "AutomationRuleExecuted",
      ),
    ).toEqual(["admin-user"]);

    expect(
      await service.getEnabledUsernamesForType("home-1", "DeviceAction"),
    ).toEqual(["admin-user", "standard-user"]);

    expect(
      await service.getEnabledUsernamesForType(
        "home-1",
        "AirQualityThresholdBreach",
      ),
    ).toEqual(["admin-user", "standard-user"]);
  });

  it("excludes users that opted out of a type", async () => {
    const { service } = makeService(users);
    await service.updatePreferences("home-1", "standard-user", [
      "AirQualityThresholdBreach",
    ]);

    expect(
      await service.getEnabledUsernamesForType("home-1", "DeviceAction"),
    ).toEqual(["admin-user"]);
    expect(
      await service.getEnabledUsernamesForType(
        "home-1",
        "AirQualityThresholdBreach",
      ),
    ).toEqual(["admin-user", "standard-user"]);
  });

  it("treats users without stored preferences as opted into everything", async () => {
    const { service } = makeService(users);
    expect(
      await service.getEnabledUsernamesForType("home-1", "DeviceAction"),
    ).toEqual(["admin-user", "standard-user"]);
  });
});
