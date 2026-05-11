import { ref, onMounted, onBeforeUnmount, watch, type Ref } from "vue";
import { io, type Socket } from "socket.io-client";
import type { SensorReading } from "@/api/sensors";

export function useSensorSocket(
  homeId: Ref<string | null> | string | null,
  token: Ref<string | null> | string | null = null,
) {
  const homeIdRef: Ref<string | null> =
    typeof homeId === "string" || homeId === null ? ref(homeId) : homeId;
  const tokenRef: Ref<string | null> =
    typeof token === "string" || token === null ? ref(token) : token;

  const readings = ref(new Map<string, SensorReading>());
  const connected = ref(false);
  let socket: Socket | null = null;

  function connect(id: string) {
    const currentToken = tokenRef.value;
    socket = io({
      query: { homeId: id },
      ...(currentToken ? { auth: { token: currentToken } } : {}),
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      connected.value = true;
    });

    socket.on("disconnect", () => {
      connected.value = false;
    });

    socket.on("sensorUpdate", (data: Omit<SensorReading, "receivedAt">) => {
      readings.value.set(data.sensorId, { ...data, receivedAt: Date.now() });
    });
  }

  function disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    connected.value = false;
  }

  onMounted(() => {
    if (homeIdRef.value) connect(homeIdRef.value);
  });

  watch(homeIdRef, (next, prev) => {
    if (next !== prev) {
      disconnect();
      readings.value = new Map();
      if (next) connect(next);
    }
  });

  onBeforeUnmount(() => disconnect());

  return { readings, connected };
}
