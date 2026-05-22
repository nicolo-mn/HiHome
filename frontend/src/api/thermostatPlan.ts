import { apiFetch } from "./client";

export async function getHourlyTemperatures(homeId: string): Promise<number[]> {
  return apiFetch<number[]>(
    `/api/home/${encodeURIComponent(homeId)}/hourly-temperatures`,
  );
}

export async function setHourlyTemperatures(
  homeId: string,
  temperatures: number[],
): Promise<void> {
  await apiFetch(
    `/api/home/${encodeURIComponent(homeId)}/hourly-temperatures`,
    {
      method: "PUT",
      body: { temperatures },
    },
  );
}
