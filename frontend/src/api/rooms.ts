import { apiFetch } from "./client";

export interface Room {
  id: string;
  name: string;
}

export async function getRooms(homeId: string): Promise<Room[]> {
  return apiFetch<Room[]>(`/api/v1/home/${encodeURIComponent(homeId)}/rooms`);
}
