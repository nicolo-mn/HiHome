import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { io, type Socket } from "socket.io-client";
import { UnauthorizedError } from "@/api/errors";
import { devicesApi } from "@/api";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import { getRooms } from "@/api/rooms";
import type {
  HomeDevice,
  ToggleableDevice,
  ThermostatDevice,
  FanDevice,
  FanMode,
  CreateDeviceInput,
  RawDevice,
} from "@/api/devices";
import { normalizeDevice } from "@/api/devices";
import { useAuthStore } from "@/stores/auth";
import { useBusyIds } from "@/composables/useBusyIds";

export const useDevicesStore = defineStore("devices", () => {
  const authStore = useAuthStore();

  const devices = ref<HomeDevice[]>([]);
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
      // Best effort: fallback to whatever roomName arrives with devices.
    }
  }

  function needsRoomNames(list: HomeDevice[]) {
    return list.some(
      (c) => c.roomId && (!c.roomName || c.roomName.trim() === c.roomId.trim()),
    );
  }

  function enrichRoomName(device: HomeDevice): HomeDevice {
    if (!device.roomId) return device;
    const mapped = roomNames.value[device.roomId];
    if (!mapped) return device;
    if (device.roomName && device.roomName.trim() !== device.roomId) {
      return device;
    }
    return { ...device, roomName: mapped };
  }

  async function fetchAll() {
    if (!homeId.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      const loaded = await devicesApi.getDevices(homeId.value);
      if (needsRoomNames(loaded)) {
        await loadRoomNames();
      }
      devices.value = loaded.map(enrichRoomName);
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
    devices.value = [];
    error.value = null;
    loadedHomeId.value = null;
  }

  function applyRemoteUpdate(raw: RawDevice) {
    if (!raw?.id) return;
    const updated = enrichRoomName(normalizeDevice(raw));
    const index = devices.value.findIndex((c) => c.id === updated.id);
    if (index === -1) {
      devices.value = [...devices.value, updated];
    } else {
      devices.value = devices.value.map((c) =>
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

    socket.on("device:updated", (payload: RawDevice) => {
      applyRemoteUpdate(payload);
    });
  }

  function disconnect() {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  }

  async function executeAction(
    deviceId: string,
    run: () => Promise<HomeDevice>,
  ) {
    if (!homeId.value) return;
    busy.add(deviceId);
    try {
      const updated = enrichRoomName(await run());
      devices.value = devices.value.map((c) =>
        c.id === updated.id ? updated : c,
      );
    } catch (e) {
      if (e instanceof UnauthorizedError) return;
      if (!error.value) {
        error.value = humanizeErrorMessage(e, "control that device");
      }
    } finally {
      busy.remove(deviceId);
    }
  }

  function toggle(device: ToggleableDevice, next: boolean) {
    if (!homeId.value) return;
    const id = homeId.value;
    return executeAction(device.id, () => devicesApi.toggle(id, device, next));
  }

  function step(device: ThermostatDevice, direction: "up" | "down") {
    if (!homeId.value) return;
    const id = homeId.value;
    return executeAction(device.id, () =>
      devicesApi.setpointDelta(id, device, direction),
    );
  }

  function setFanMode(device: FanDevice, mode: FanMode) {
    if (!homeId.value) return;
    const id = homeId.value;
    return executeAction(device.id, () =>
      devicesApi.setFanMode(id, device, mode),
    );
  }

  async function addDevice(input: CreateDeviceInput) {
    if (!homeId.value) return;
    error.value = null;
    try {
      const created = await devicesApi.createDevice(homeId.value, input);
      if (created.roomId && !roomNames.value[created.roomId]) {
        await loadRoomNames();
      }
      const resolved = enrichRoomName(created);
      devices.value = [...devices.value, resolved];
      return created;
    } catch (e) {
      if (!(e instanceof UnauthorizedError)) {
        error.value = humanizeErrorMessage(e, "add the device");
      }
      throw e;
    }
  }

  function isBusy(deviceId: string) {
    return busy.has(deviceId);
  }

  return {
    devices,
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
    addDevice,
    connect,
    disconnect,
  };
});
