import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  preferencesApi,
  ALL_NOTIFICATION_TYPES,
  type NotificationType,
} from "@/api";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import { useAuthStore } from "@/stores/auth";

export const usePreferencesStore = defineStore("preferences", () => {
  const authStore = useAuthStore();

  const preferences = ref<NotificationType[]>([...ALL_NOTIFICATION_TYPES]);
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
      preferences.value = await preferencesApi.getPreferences(homeId.value);
      loadedHomeId.value = homeId.value;
    } catch (e) {
      error.value = humanizeErrorMessage(e, "load your notification settings");
    } finally {
      isLoading.value = false;
    }
  }

  async function load() {
    if (isLoaded.value || isLoading.value) return;
    await fetchAll();
  }

  async function update(types: NotificationType[]) {
    if (!homeId.value) return;
    error.value = null;
    try {
      preferences.value = await preferencesApi.updatePreferences(
        homeId.value,
        types,
      );
    } catch (e) {
      error.value = humanizeErrorMessage(
        e,
        "update your notification settings",
      );
    }
  }

  return {
    preferences,
    isLoading,
    error,
    isLoaded,
    load,
    fetchAll,
    update,
  };
});
