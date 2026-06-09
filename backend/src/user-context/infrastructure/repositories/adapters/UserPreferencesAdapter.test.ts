import { describe, it, expect, vi } from "vitest";
import { UserPreferencesAdapter } from "./UserPreferencesAdapter";
import { PreferencesRepository } from "../../../domain/PreferencesRepository";

describe("UserPreferencesAdapter", () => {
  it("filters out non-admins for AutomationRuleExecuted and DeviceAction, but keeps them for other types", async () => {
    const mockPrefsRepo: PreferencesRepository = {
      findAllByHome: vi.fn().mockResolvedValue([
        {
          username: "admin-user",
          role: "Admin",
          notificationPreferences: [
            "AirQualityThresholdBreach",
            "AutomationRuleExecuted",
            "DeviceAction",
          ],
        },
        {
          username: "standard-user",
          role: "Standard",
          notificationPreferences: [
            "AirQualityThresholdBreach",
            "AutomationRuleExecuted",
            "DeviceAction",
          ],
        },
      ]),
      findPreferences: vi.fn(),
      updatePreferences: vi.fn(),
    };

    const adapter = new UserPreferencesAdapter(mockPrefsRepo);

    // Test AutomationRuleExecuted
    const ruleRecipients = await adapter.getEnabledUsernamesForType(
      "home-1",
      "AutomationRuleExecuted",
    );
    expect(ruleRecipients).toEqual(["admin-user"]);

    // Test DeviceAction
    const deviceRecipients = await adapter.getEnabledUsernamesForType(
      "home-1",
      "DeviceAction",
    );
    expect(deviceRecipients).toEqual(["admin-user", "standard-user"]);

    // Test AirQualityThresholdBreach
    const airQualityRecipients = await adapter.getEnabledUsernamesForType(
      "home-1",
      "AirQualityThresholdBreach",
    );
    expect(airQualityRecipients).toEqual(["admin-user", "standard-user"]);
  });
});
