import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { usersApi, type RoleName, type UserSummary } from "@/api";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import { useAuthStore } from "@/stores/auth";

export const useUsersStore = defineStore("users", () => {
  const authStore = useAuthStore();

  const users = ref<UserSummary[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loadedHomeId = ref<string | null>(null);

  const homeId = computed(() => authStore.homeId);
  const isLoaded = computed(
    () => loadedHomeId.value !== null && loadedHomeId.value === homeId.value,
  );

  async function fetchAll() {
    const targetHomeId = homeId.value;
    if (!targetHomeId) return;
    isLoading.value = true;
    error.value = null;
    try {
      const result = await usersApi.getUsers(targetHomeId);
      if (targetHomeId !== homeId.value) return;
      users.value = result;
      loadedHomeId.value = targetHomeId;
    } catch (e) {
      if (targetHomeId !== homeId.value) return;
      error.value = humanizeErrorMessage(e, "load the user list");
    } finally {
      if (targetHomeId === homeId.value) isLoading.value = false;
    }
  }

  async function load() {
    if (isLoaded.value || isLoading.value) return;
    await fetchAll();
  }

  async function changeRole(userId: string, role: RoleName) {
    const targetHomeId = homeId.value;
    if (!targetHomeId) return;
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await usersApi.changeRole(targetHomeId, userId, role);
      if (targetHomeId !== homeId.value) return;
      const idx = users.value.findIndex((u) => u.id === userId);
      if (idx !== -1) users.value[idx] = updated;
    } catch (e) {
      if (targetHomeId !== homeId.value) return;
      error.value = humanizeErrorMessage(e, "change that user's role");
    } finally {
      if (targetHomeId === homeId.value) isLoading.value = false;
    }
  }

  return {
    users,
    isLoading,
    error,
    isLoaded,
    load,
    fetchAll,
    changeRole,
  };
});
