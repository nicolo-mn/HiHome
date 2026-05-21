import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { componentsApi } from "@/api";
import type {
  HomeComponent,
  ToggleableComponent,
  ThermostatComponent,
  CreateComponentInput,
} from "@/api/components";
import { useAuthStore } from "@/stores/auth";
import { useBusyIds } from "@/composables/useBusyIds";

export const useComponentsStore = defineStore("components", () => {
  const authStore = useAuthStore();

  const components = ref<HomeComponent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loadedHomeId = ref<string | null>(null);
  const busy = useBusyIds();

  const homeId = computed(() => authStore.homeId);
  const isLoaded = computed(
    () => loadedHomeId.value !== null && loadedHomeId.value === homeId.value,
  );

  async function fetchAll() {
    if (!homeId.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      components.value = await componentsApi.getComponents(homeId.value);
      loadedHomeId.value = homeId.value;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to load components";
    } finally {
      isLoading.value = false;
    }
  }

  async function load() {
    if (isLoaded.value || isLoading.value) return;
    await fetchAll();
  }

  async function refresh() {
    await fetchAll();
  }

  function reset() {
    components.value = [];
    error.value = null;
    loadedHomeId.value = null;
  }

  async function executeAction(
    componentId: string,
    run: () => Promise<HomeComponent>,
  ) {
    if (!homeId.value) return;
    busy.add(componentId);
    try {
      const updated = await run();
      components.value = components.value.map((c) =>
        c.id === updated.id ? updated : c,
      );
    } catch (e) {
      if (!error.value) {
        error.value = e instanceof Error ? e.message : "Action failed";
      }
    } finally {
      busy.remove(componentId);
    }
  }

  function toggle(component: ToggleableComponent, next: boolean) {
    if (!homeId.value) return;
    const id = homeId.value;
    return executeAction(component.id, () =>
      componentsApi.toggle(id, component, next),
    );
  }

  function step(component: ThermostatComponent, direction: "up" | "down") {
    if (!homeId.value) return;
    const id = homeId.value;
    return executeAction(component.id, () =>
      componentsApi.setpointDelta(id, component, direction),
    );
  }

  async function addComponent(input: CreateComponentInput) {
    if (!homeId.value) return;
    error.value = null;
    try {
      const created = await componentsApi.createComponent(homeId.value, input);
      components.value = [...components.value, created];
      return created;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add component";
      throw e;
    }
  }

  function isBusy(componentId: string) {
    return busy.has(componentId);
  }

  return {
    components,
    isLoading,
    error,
    isLoaded,
    isBusy,
    load,
    refresh,
    reset,
    toggle,
    step,
    addComponent,
  };
});
