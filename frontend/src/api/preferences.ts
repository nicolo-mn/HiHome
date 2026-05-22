import { apiFetch } from "./client";

export const ALL_NOTIFICATION_TYPES = [
  "AirQualityThresholdBreach",
  "AutomationRuleExecuted",
  "ComponentAction",
] as const;

export type NotificationType = (typeof ALL_NOTIFICATION_TYPES)[number];

export const TYPE_LABELS: Record<NotificationType, string> = {
  AirQualityThresholdBreach: "Air quality alerts",
  AutomationRuleExecuted: "Automation rule events",
  ComponentAction: "Component actions",
};

export async function getPreferences(
  homeId: string,
): Promise<NotificationType[]> {
  const data = await apiFetch<{ notificationPreferences: NotificationType[] }>(
    `/api/home/${encodeURIComponent(homeId)}/users/me/preferences`,
  );
  return data.notificationPreferences;
}

export async function updatePreferences(
  homeId: string,
  types: NotificationType[],
): Promise<NotificationType[]> {
  const data = await apiFetch<{ notificationPreferences: NotificationType[] }>(
    `/api/home/${encodeURIComponent(homeId)}/users/me/preferences`,
    { method: "PUT", body: { notificationPreferences: types } },
  );
  return data.notificationPreferences;
}
