import { apiFetch } from "./client";

export async function getLocationName(homeId: string): Promise<string | null> {
  const data = await apiFetch<{ locationName: string | null }>(
    `/api/home/${encodeURIComponent(homeId)}/location-name`,
  );
  return data.locationName;
}
