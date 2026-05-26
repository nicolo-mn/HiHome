import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { notificationsApi } from "@/api";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import type { NotificationDTO } from "@/api/notifications";
import { useAuthStore } from "@/stores/auth";

export const useNotificationsStore = defineStore("notifications", () => {
  const authStore = useAuthStore();

  const notifications = ref<NotificationDTO[]>([]);
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
      notifications.value = await notificationsApi.getNotifications(
        homeId.value,
      );
      loadedHomeId.value = homeId.value;
    } catch (e) {
      error.value = humanizeErrorMessage(e, "load your notifications");
    } finally {
      isLoading.value = false;
    }
  }

  async function load() {
    if (isLoaded.value || isLoading.value) return;
    await fetchAll();
  }

  function addRealtime(notification: NotificationDTO) {
    notifications.value = [notification, ...notifications.value];
  }

  return {
    notifications,
    isLoading,
    error,
    isLoaded,
    load,
    fetchAll,
    addRealtime,
  };
});
