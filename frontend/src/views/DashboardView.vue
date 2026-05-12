<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useSensorSocket } from "@/composables/useSensorSocket";
import SensorCard from "@/components/cards/SensorCard.vue";

const authStore = useAuthStore();
const homeId = computed(() => authStore.homeId);

const { readings } = useSensorSocket(homeId, authStore.token);
const sensorReadings = computed(() => Array.from(readings.value.values()));
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-light text-primary">Dashboard</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <SensorCard
        v-for="reading in sensorReadings"
        :key="reading.sensorId"
        :reading="reading"
      />
    </div>
  </div>
</template>
