import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { usageApi } from "@/api";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import type { UsageRange, UsageReport } from "@/api/usage";
import { useAuthStore } from "@/stores/auth";

export const useUsageStore = defineStore("usage", () => {
  const authStore = useAuthStore();

  const report = ref<UsageReport | null>(null);
  const range = ref<UsageRange>("week");
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const homeId = computed(() => authStore.homeId);

  async function load() {
    if (!homeId.value || isLoading.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      report.value = await usageApi.getUsage(homeId.value, range.value);
    } catch (e) {
      error.value = humanizeErrorMessage(e, "load usage insights");
      report.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  function setRange(next: UsageRange) {
    if (next === range.value) return;
    range.value = next;
    void load();
  }

  return {
    report,
    range,
    isLoading,
    error,
    load,
    setRange,
  };
});
