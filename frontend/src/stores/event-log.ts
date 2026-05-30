import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { eventLogApi } from "@/api";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import type { DeviceEventDTO } from "@/api/event-log";
import { useAuthStore } from "@/stores/auth";

export const useEventLogStore = defineStore("event-log", () => {
  const authStore = useAuthStore();

  const events = ref<DeviceEventDTO[]>([]);
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
      events.value = await eventLogApi.getDeviceEvents(homeId.value);
      loadedHomeId.value = homeId.value;
    } catch (e) {
      error.value = humanizeErrorMessage(e, "load the event log");
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
