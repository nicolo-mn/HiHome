import { defineStore } from "pinia";
import { ref } from "vue";
import { io, type Socket } from "socket.io-client";
import type { SensorReading } from "@/api/sensors";
import { useAuthStore } from "@/stores/auth";

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

type ReadingBuilder = (
  payload: any,
) => Omit<SensorReading, "receivedAt"> | null;

const SENSOR_MAPPINGS: Record<string, ReadingBuilder> = {
  "sensor:internal-temperature": (p) =>
    typeof p?.temperature === "number"
      ? {
          sensorId: "internal-thermometer",
          type: "thermometer",
          value: p.temperature,
          measureUnit: "celsius",
        }
      : null,
  "sensor:external-temperature": (p) =>
    typeof p?.temperature === "number"
      ? {
          sensorId: "external-thermometer",
          type: "outdoor_temperature",
          value: p.temperature,
          measureUnit: "celsius",
        }
      : null,
  "sensor:air-quality": (p) =>
    typeof p?.AQI === "number"
      ? {
          sensorId: "air-quality",
          type: "outdoor_airquality",
          value: p.AQI,
          measureUnit: "eaqi",
        }
      : null,
  "sensor:wind": (p) =>
    typeof p?.windSpeed === "number"
      ? {
          sensorId: "wind-speed",
          type: "wind",
          value: p.windSpeed,
          measureUnit: "km/h",
        }
      : null,
  "sensor:weather": (p) =>
    typeof p?.forecast === "string"
      ? {
          sensorId: "weather",
          type: "weather",
          value: p.forecast,
          measureUnit: "",
        }
      : null,
};

export const useSensorStore = defineStore("sensors", () => {
  const readings = ref(new Map<string, SensorReading>());
  const connected = ref(false);
  const error = ref<string | null>(null);
  let socket: Socket | null = null;

  function connect() {
    if (socket) return;
    const homeId = useAuthStore().homeId;
    if (!homeId) return;

    socket = io({
      query: { homeId },
      auth: (cb) => {
        const t = useAuthStore().token;
        cb(t ? { token: t } : {});
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      connected.value = true;
      error.value = null;
    });
    socket.on("disconnect", () => {
      connected.value = false;
    });
    socket.on("connect_error", (err: Error) => {
      connected.value = false;
      error.value = err.message || "Connection error";
    });

    for (const [event, build] of Object.entries(SENSOR_MAPPINGS)) {
      socket.on(event, (payload: unknown) => {
        const reading = build(payload);
        if (!reading) {
          console.warn(`Invalid sensor payload for ${event}`, payload);
          return;
        }
        readings.value.set(reading.sensorId, {
          ...reading,
          receivedAt: Date.now(),
        });
      });
    }
  }

  function disconnect() {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
    readings.value = new Map();
    connected.value = false;
    error.value = null;
  }

  return { readings, connected, error, connect, disconnect };
});
