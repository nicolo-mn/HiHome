import { computed, type ComputedRef, type Ref } from "vue";
import type { HomeDevice } from "@/api/devices";

export interface RoomGroup {
  roomId: string;
  label: string;
  items: HomeDevice[];
}

const UNASSIGNED = "__unassigned__";

export function useRoomGroups(
  devices: Ref<HomeDevice[]>,
): ComputedRef<RoomGroup[]> {
  return computed(() => {
    const map = new Map<string, HomeDevice[]>();
    for (const comp of devices.value) {
      const key = comp.roomId ?? UNASSIGNED;
      const list = map.get(key) ?? [];
      list.push(comp);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([roomId, items]) => {
      const label =
        roomId === UNASSIGNED ? "Other" : (items[0]?.roomName ?? roomId);
      return { roomId, label, items };
    });
  });
}
