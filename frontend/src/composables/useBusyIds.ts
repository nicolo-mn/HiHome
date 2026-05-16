import { ref } from "vue";

export function useBusyIds() {
  const busyIds = ref(new Set<string>());

  function add(id: string) {
    busyIds.value.add(id);
  }

  function remove(id: string) {
    busyIds.value.delete(id);
  }

  function has(id: string) {
    return busyIds.value.has(id);
  }

  return { busyIds, add, remove, has };
}
