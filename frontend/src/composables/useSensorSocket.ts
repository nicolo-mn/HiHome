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

    const isActive = () => socket === currentSocket;

    currentSocket.on("connect", () => {
      if (!isActive()) return;
      connected.value = true;
      error.value = null;
    });

    currentSocket.on("disconnect", () => {
      if (!isActive()) return;
      connected.value = false;
    });

    currentSocket.on("connect_error", (err: Error) => {
      if (!isActive()) return;
      connected.value = false;
      error.value = err.message || "Connection error";
    });

    currentSocket.on("error", (err: unknown) => {
      if (!isActive()) return;
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Socket error";
      error.value = message;
    });

    function record(reading: SensorReading) {
      if (!isActive()) return;
      readings.value.set(reading.sensorId, reading);
    }

    currentSocket.on(
      "sensor:internal-temperature",
      (p: { temperature: number }) =>
        record({
          sensorId: "internal-temperature",
          type: "thermometer",
          value: p.temperature,
          measureUnit: "celsius",
          receivedAt: Date.now(),
        }),
    );

    currentSocket.on(
      "sensor:external-temperature",
      (p: { temperature: number }) =>
        record({
          sensorId: "external-temperature",
          type: "outdoor_temperature",
          value: p.temperature,
          measureUnit: "celsius",
          receivedAt: Date.now(),
        }),
    );

    currentSocket.on("sensor:air-quality", (p: { AQI: number }) =>
      record({
        sensorId: "air-quality",
        type: "outdoor_airquality",
        value: p.AQI,
        measureUnit: "eaqi",
        receivedAt: Date.now(),
      }),
    );

    currentSocket.on(
      "sensor:wind",
      (p: { windDirection: number; windSpeed: number }) =>
        record({
          sensorId: "wind",
          type: "wind",
          value: p.windSpeed,
          measureUnit: "km/h",
          receivedAt: Date.now(),
        }),
    );

    const FORECAST_NAMES = [
      "Clear",
      "Drizzle",
      "Fog",
      "Overcast",
      "Cloudy",
      "Rain",
      "Snow",
      "Thunderstorm",
    ] as const;

    currentSocket.on(
      "sensor:weather",
      (p: { forecast: number; precipitation: number }) =>
        record({
          sensorId: "weather",
          type: "weather",
          value: FORECAST_NAMES[p.forecast] ?? "Unknown",
          measureUnit: "",
          receivedAt: Date.now(),
        }),
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
