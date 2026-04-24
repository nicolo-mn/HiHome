import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./auth-store";

export interface ComponentData {
  id: string;
  homeId: string;
  name: string;
  type: "light" | "window" | "climatization";
  status: Record<string, unknown>;
}

export interface SensorReading {
  type: "weather" | "temperature" | "air_quality";
  value: number | string;
  unit: string;
  timestamp: string;
}

export const useHomeStore = defineStore("home", () => {
  const components = ref<ComponentData[]>([]);
  const sensorReadings = ref<SensorReading[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let ws: WebSocket | null = null;

  async function fetchComponents(): Promise<void> {
    const auth = useAuthStore();
    if (!auth.token || !auth.homeId) return;

    isLoading.value = true;
    error.value = null;

    try {
      const res = await fetch(`/api/homes/${auth.homeId}/components`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch components");
      }

      const data = await res.json();
      components.value = data.components;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch components";
    } finally {
      isLoading.value = false;
    }
  }

  async function updateComponentStatus(
    componentId: string,
    status: Record<string, unknown>,
  ): Promise<void> {
    const auth = useAuthStore();
    if (!auth.token || !auth.homeId) return;

    try {
      const res = await fetch(
        `/api/homes/${auth.homeId}/components/${componentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update component");
      }

      const data = await res.json();
      // Update the component in the local state
      const idx = components.value.findIndex((c) => c.id === componentId);
      if (idx !== -1) {
        components.value[idx] = data.component;
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update component";
    }
  }

  function connectSensors(): void {
    const auth = useAuthStore();
    if (!auth.token) return;

    disconnectSensors();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/sensors?token=${auth.token}`;

    ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "sensor_update") {
          sensorReadings.value = msg.readings;
        }
      } catch {
        // Ignore invalid messages
      }
    };

    ws.onclose = () => {
      ws = null;
    };
  }

  function disconnectSensors(): void {
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  function $reset(): void {
    components.value = [];
    sensorReadings.value = [];
    isLoading.value = false;
    error.value = null;
    disconnectSensors();
  }

  return {
    components,
    sensorReadings,
    isLoading,
    error,
    fetchComponents,
    updateComponentStatus,
    connectSensors,
    disconnectSensors,
    $reset,
  };
});
