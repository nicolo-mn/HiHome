<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { componentsApi } from "@/api";
import type {
  HomeComponent,
  ToggleableComponent,
  ThermostatComponent,
} from "@/api/components";
import { useAuthStore } from "@/stores/auth";
import { useSensorSocket } from "@/composables/useSensorSocket";
import { useBusyIds } from "@/composables/useBusyIds";
import { useAsyncAction } from "@/composables/useAsyncAction";
import { useRoomGroups } from "@/composables/useRoomGroups";
import ComponentCard from "@/components/cards/ComponentCard.vue";
import SensorCard from "@/components/cards/SensorCard.vue";
import AddComponentCard from "@/components/cards/AddComponentCard.vue";
import BaseButton from "@/components/BaseButton.vue";

const authStore = useAuthStore();
const homeId = computed(() => authStore.homeId);

const components = ref<HomeComponent[]>([]);
const busy = useBusyIds();

const {
  run: load,
  isLoading,
  error,
} = useAsyncAction(
  async () => {
    if (!homeId.value) return;
    components.value = await componentsApi.getComponents(homeId.value);
  },
  {
    onError: (e) =>
      e instanceof Error ? e.message : "Failed to load components",
  },
);

const { readings } = useSensorSocket(homeId, authStore.token);
const sensorReadings = computed(() => Array.from(readings.value.values()));

const roomGroups = useRoomGroups(components);

async function executeComponentAction(
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

function handleToggle(component: ToggleableComponent, next: boolean) {
  if (!homeId.value) return;
  const id = homeId.value;
  executeComponentAction(component.id, () =>
    componentsApi.toggle(id, component, next),
  );
}

function handleStep(component: ThermostatComponent, direction: "up" | "down") {
  if (!homeId.value) return;
  const id = homeId.value;
  executeComponentAction(component.id, () =>
    componentsApi.setpointDelta(id, component, direction),
  );
}

function onAddComponentClick(roomId: string) {
  // TODO: open an add-component dialog scoped to roomId.
  void roomId;
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
          :busy="busy.has(item.id)"
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
