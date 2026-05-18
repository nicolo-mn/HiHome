import { apiFetch } from "./client";

export interface NotificationDTO {
  id: string;
  homeId: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export async function getNotifications(
  homeId: string,
): Promise<NotificationDTO[]> {
  const data = await apiFetch<{ notifications: NotificationDTO[] }>(
    `/api/home/${encodeURIComponent(homeId)}/notifications`,
  );
  return data.notifications;
}
