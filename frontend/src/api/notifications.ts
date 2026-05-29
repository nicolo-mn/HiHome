import { apiFetch } from "./client";

export interface RuleExecutionRecap {
  ruleName: string;
  actions: string[];
}

export interface NotificationDetails {
  executions: RuleExecutionRecap[];
}

export interface NotificationDTO {
  id: string;
  homeId: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  details?: NotificationDetails;
}

export async function getNotifications(
  homeId: string,
): Promise<NotificationDTO[]> {
  const data = await apiFetch<{ notifications: NotificationDTO[] }>(
    `/api/v1/home/${encodeURIComponent(homeId)}/notifications`,
  );
  return data.notifications;
}
