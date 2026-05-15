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
  const error = ref<string | null>(null);
  let socket: Socket | null = null;

  function connect(id: string) {
    const currentToken = tokenRef.value;
    const currentSocket: Socket = io({
      query: { homeId: id },
      ...(currentToken ? { auth: { token: currentToken } } : {}),
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socket = currentSocket;

    currentSocket.on("connect", () => {
      connected.value = true;
      error.value = null;
    });

    currentSocket.on("disconnect", () => {
      connected.value = false;
    });

    currentSocket.on("connect_error", (err: Error) => {
      connected.value = false;
      error.value = err.message || "Connection error";
    });

    currentSocket.on("error", (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Socket error";
      error.value = message;
    });

    currentSocket.on(
      "sensorUpdate",
      (data: Omit<SensorReading, "receivedAt">) => {
        if (socket !== currentSocket) return;
        readings.value.set(data.sensorId, { ...data, receivedAt: Date.now() });
      },
    );
  }

  function disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    connected.value = false;
  }

  function reset(nextId: string | null) {
    disconnect();
    readings.value = new Map();
    error.value = null;
    if (nextId) connect(nextId);
  }

  onMounted(() => {
    if (homeIdRef.value) connect(homeIdRef.value);
  });

  watch(homeIdRef, (next, prev) => {
    if (next !== prev) reset(next);
  });

  watch(tokenRef, (next, prev) => {
    if (next !== prev) reset(homeIdRef.value);
  });

  onBeforeUnmount(() => disconnect());

  return { readings, connected, error };
}
