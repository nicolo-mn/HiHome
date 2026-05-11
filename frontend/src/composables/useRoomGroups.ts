import { computed, type ComputedRef, type Ref } from "vue";
import type { HomeComponent } from "../api/components";

export interface RoomGroup {
  roomId: string;
  label: string;
  items: HomeComponent[];
}

const UNASSIGNED = "__unassigned__";

function formatRoomLabel(roomId: string): string {
  return roomId
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function useRoomGroups(
  components: Ref<HomeComponent[]>,
): ComputedRef<RoomGroup[]> {
  return computed(() => {
    const map = new Map<string, HomeComponent[]>();
    for (const comp of components.value) {
      const key = comp.roomId ?? UNASSIGNED;
      const list = map.get(key) ?? [];
      list.push(comp);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([roomId, items]) => ({
      roomId,
      label: roomId === UNASSIGNED ? "Other" : formatRoomLabel(roomId),
      items,
    }));
  });
}
