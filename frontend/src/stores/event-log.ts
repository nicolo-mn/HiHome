import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { eventLogApi } from "@/api";
import type { ComponentEventDTO } from "@/api/event-log";
import { useAuthStore } from "@/stores/auth";

export const useEventLogStore = defineStore("event-log", () => {
  const authStore = useAuthStore();

  const events = ref<ComponentEventDTO[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loadedHomeId = ref<string | null>(null);

  const homeId = computed(() => authStore.homeId);
  const isLoaded = computed(
    () => loadedHomeId.value !== null && loadedHomeId.value === homeId.value,
  );

  async function fetchAll() {
    if (!homeId.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      events.value = await eventLogApi.getComponentEvents(homeId.value);
      loadedHomeId.value = homeId.value;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to load event log";
    } finally {
      isLoading.value = false;
    }
  }

  async function load() {
    if (isLoaded.value || isLoading.value) return;
    await fetchAll();
  }

  return {
    events,
    isLoading,
    error,
    isLoaded,
    fetchAll,
    load,
  };
});
