import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { io, type Socket } from "socket.io-client";
import { componentsApi } from "@/api";
import { UnauthorizedError } from "@/api/errors";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import { getRooms } from "@/api/rooms";
import type {
  HomeComponent,
  ToggleableComponent,
  ThermostatComponent,
  FanComponent,
  FanMode,
  CreateComponentInput,
  RawComponent,
} from "@/api/components";
import { normalizeComponent } from "@/api/components";
import { useAuthStore } from "@/stores/auth";
import { useBusyIds } from "@/composables/useBusyIds";

export const useComponentsStore = defineStore("components", () => {
  const authStore = useAuthStore();

  const components = ref<HomeComponent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loadedHomeId = ref<string | null>(null);
  const roomNames = ref<Record<string, string>>({});
  const busy = useBusyIds();
  let socket: Socket | null = null;

  const homeId = computed(() => authStore.homeId);
  const isLoaded = computed(
    () => loadedHomeId.value !== null && loadedHomeId.value === homeId.value,
  );

  async function loadRoomNames() {
    if (!homeId.value) return;
    try {
      const rooms = await getRooms(homeId.value);
      const next: Record<string, string> = {};
      for (const room of rooms) {
        next[room.id] = room.name;
      }
      roomNames.value = next;
    } catch {
      // Best effort: fallback to whatever roomName arrives with components.
    }
  }

  function needsRoomNames(list: HomeComponent[]) {
    return list.some(
      (c) => c.roomId && (!c.roomName || c.roomName.trim() === c.roomId.trim()),
    );
  }

  function enrichRoomName(component: HomeComponent): HomeComponent {
    if (!component.roomId) return component;
    const mapped = roomNames.value[component.roomId];
    if (!mapped) return component;
    if (component.roomName && component.roomName.trim() !== component.roomId) {
      return component;
    }
    return { ...component, roomName: mapped };
  }

  async function fetchAll() {
    if (!homeId.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      const loaded = await componentsApi.getComponents(homeId.value);
      if (needsRoomNames(loaded)) {
        await loadRoomNames();
      }
      components.value = loaded.map(enrichRoomName);
      loadedHomeId.value = homeId.value;
    } catch (e) {
      if (e instanceof UnauthorizedError) return;
      error.value = humanizeErrorMessage(e, "load your devices");
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

  function applyRemoteUpdate(raw: RawComponent) {
    if (!raw?.id) return;
    const updated = enrichRoomName(normalizeComponent(raw));
    const index = components.value.findIndex((c) => c.id === updated.id);
    if (index === -1) {
      components.value = [...components.value, updated];
    } else {
      components.value = components.value.map((c) =>
        c.id === updated.id ? updated : c,
      );
    }
  }

  function connect() {
    if (socket) return;
    const homeId = authStore.homeId;
    if (!homeId) return;

    socket = io({
      query: { homeId },
      auth: (cb) => {
        const t = authStore.token;
        cb(t ? { token: t } : {});
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("component:updated", (payload: RawComponent) => {
      applyRemoteUpdate(payload);
    });
  }

  function disconnect() {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  }

  async function executeAction(
    componentId: string,
    run: () => Promise<HomeComponent>,
  ) {
    if (!homeId.value) return;
    busy.add(componentId);
    try {
      const updated = enrichRoomName(await run());
      components.value = components.value.map((c) =>
        c.id === updated.id ? updated : c,
      );
    } catch (e) {
      if (e instanceof UnauthorizedError) return;
      if (!error.value) {
        error.value = humanizeErrorMessage(e, "control that device");
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

  function setFanMode(component: FanComponent, mode: FanMode) {
    if (!homeId.value) return;
    const id = homeId.value;
    return executeAction(component.id, () =>
      componentsApi.setFanMode(id, component, mode),
    );
  }

  async function addComponent(input: CreateComponentInput) {
    if (!homeId.value) return;
    error.value = null;
    try {
      const created = await componentsApi.createComponent(homeId.value, input);
      if (created.roomId && !roomNames.value[created.roomId]) {
        await loadRoomNames();
      }
      const resolved = enrichRoomName(created);
      components.value = [...components.value, resolved];
      return created;
    } catch (e) {
      if (!(e instanceof UnauthorizedError)) {
        error.value = humanizeErrorMessage(e, "add the device");
      }
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
    setFanMode,
    addComponent,
    connect,
    disconnect,
  };
});
