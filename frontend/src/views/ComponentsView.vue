<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { homeApi } from "../api";
import type {
  HomeComponent,
  ToggleableComponent,
  ThermostatComponent,
} from "../api/home";
import { useAuthStore } from "../stores/auth";
import { useSensorSocket } from "../composables/useSensorSocket";
import ComponentCard from "../components/cards/ComponentCard.vue";
import SensorCard from "../components/cards/SensorCard.vue";
import AddComponentCard from "../components/cards/AddComponentCard.vue";
import BaseButton from "../components/BaseButton.vue";

const authStore = useAuthStore();
const homeId = computed(() => authStore.houseId);

const components = ref<HomeComponent[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const busyIds = ref(new Set<string>());

const { readings } = useSensorSocket(homeId, authStore.token);
const sensorReadings = computed(() => Array.from(readings.value.values()));

interface RoomGroup {
  roomId: string;
  label: string;
  items: HomeComponent[];
}

function formatRoomLabel(roomId: string): string {
  return roomId
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const roomGroups = computed<RoomGroup[]>(() => {
  const map = new Map<string, HomeComponent[]>();
  for (const comp of components.value) {
    const key = comp.roomId ?? "__unassigned__";
    const list = map.get(key) ?? [];
    list.push(comp);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([roomId, items]) => ({
    roomId,
    label: roomId === "__unassigned__" ? "Other" : formatRoomLabel(roomId),
    items,
  }));
});

function resolveToggleAction(type: string, next: boolean): string | null {
  if (type === "light") return next ? "turnOn" : "turnOff";
  if (type === "window") return next ? "open" : "close";
  console.warn(`No toggle action mapping for type: ${type}`);
  return null;
}

const THERMOSTAT_STEP = 0.5;

function resolveStepAction(
  component: ThermostatComponent,
  direction: "up" | "down",
): { action: string; body: unknown } | null {
  if (component.type === "thermostat") {
    const delta = direction === "up" ? THERMOSTAT_STEP : -THERMOSTAT_STEP;
    return {
      action: "setTemperature",
      body: { temperature: component.setpoint + delta },
    };
  }
  console.warn(`No step action mapping for type: ${component.type}`);
  return null;
}

async function executeComponentAction(
  componentId: string,
  action: string,
  body?: unknown,
) {
  if (!homeId.value) return;
  busyIds.value = new Set(busyIds.value).add(componentId);
  try {
    const updated = await homeApi.executeAction(
      homeId.value,
      componentId,
      action,
      body,
    );
    components.value = components.value.map((c) =>
      c.id === updated.id ? updated : c,
    );
  } catch (e) {
    if (!error.value) {
      error.value = e instanceof Error ? e.message : "Action failed";
    }
  } finally {
    const nextSet = new Set(busyIds.value);
    nextSet.delete(componentId);
    busyIds.value = nextSet;
  }
}

function handleToggle(component: ToggleableComponent, next: boolean) {
  const action = resolveToggleAction(component.type, next);
  if (action) executeComponentAction(component.id, action);
}

function handleStep(component: ThermostatComponent, direction: "up" | "down") {
  const resolved = resolveStepAction(component, direction);
  if (resolved)
    executeComponentAction(component.id, resolved.action, resolved.body);
}

function onAddComponentClick(roomId: string) {
  // TODO: open an add-component dialog scoped to roomId.
  void roomId;
}

async function load() {
  if (!homeId.value) return;
  isLoading.value = true;
  error.value = null;
  try {
    components.value = await homeApi.getComponents(homeId.value);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load components";
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="error && components.length === 0" class="flex flex-col gap-2">
      <p class="text-red-400 text-sm">{{ error }}</p>
      <BaseButton label="Riprova" @click="load" />
    </div>
    <p v-else-if="error" class="text-red-400 text-sm">{{ error }}</p>

    <div v-if="isLoading && components.length === 0" class="text-muted text-sm">
      Loading components…
    </div>

    <section
      v-for="group in roomGroups"
      :key="group.roomId"
      class="flex flex-col gap-3"
    >
      <h2 class="text-xl font-light text-primary">{{ group.label }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ComponentCard
          v-for="item in group.items"
          :key="item.id"
          :component="item"
          :busy="busyIds.has(item.id)"
          @toggle="handleToggle"
          @step="handleStep"
        />
        <AddComponentCard disabled @click="onAddComponentClick(group.roomId)" />
      </div>
    </section>

    <section v-if="sensorReadings.length > 0" class="flex flex-col gap-3">
      <h2 class="text-xl font-light text-primary">Sensors</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SensorCard
          v-for="reading in sensorReadings"
          :key="reading.sensorId"
          :reading="reading"
        />
      </div>
    </section>
  </div>
</template>
