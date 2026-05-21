<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSensorStore } from "@/stores/sensors";
import SensorCard from "@/components/cards/SensorCard.vue";

const sensorStore = useSensorStore();
const { readings, connected, error } = storeToRefs(sensorStore);
const sensorOrder = [
  "outdoor_temperature",
  "airquality",
  "thermometer",
  "weather",
  "wind",
];

const sensorReadings = computed(() =>
  Array.from(readings.value.values()).sort((a, b) => {
    const aIndex = sensorOrder.indexOf(a.type);
    const bIndex = sensorOrder.indexOf(b.type);
    const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    if (aRank !== bRank) return aRank - bRank;
    return a.sensorId.localeCompare(b.sensorId);
  }),
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <h1 class="text-2xl font-light text-primary">Dashboard</h1>
      <RouterLink
        to="/chat"
        class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-surface text-sm font-medium hover:brightness-110 transition"
      >
        Open chat assistant
      </RouterLink>
    </div>

    <p v-if="error" class="text-danger text-sm" role="alert">
      Real-time connection unavailable: {{ error }}
    </p>
    <p v-else-if="!connected" class="text-muted text-sm">Connecting…</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <SensorCard
        v-for="reading in sensorReadings"
        :key="reading.sensorId"
        :reading="reading"
      />
    </div>
  </div>
</template>
