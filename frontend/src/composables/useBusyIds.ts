import { ref } from "vue";

export function useBusyIds() {
  const busyIds = ref(new Set<string>());

  function add(id: string) {
    busyIds.value = new Set(busyIds.value).add(id);
  }

  function remove(id: string) {
    const next = new Set(busyIds.value);
    next.delete(id);
    busyIds.value = next;
  }

  function has(id: string) {
    return busyIds.value.has(id);
  }

  return { busyIds, add, remove, has };
}
