<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useSensorSocket } from "@/composables/useSensorSocket";
import SensorCard from "@/components/cards/SensorCard.vue";

const authStore = useAuthStore();
const { token } = storeToRefs(authStore);
const homeId = computed(() => authStore.homeId);

const { readings, connected, error } = useSensorSocket(homeId, token);
const sensorReadings = computed(() => Array.from(readings.value.values()));
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
      Connessione in tempo reale non disponibile: {{ error }}
    </p>
    <p v-else-if="!connected" class="text-muted text-sm">
      Connessione in corso…
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <SensorCard
        v-for="reading in sensorReadings"
        :key="reading.sensorId"
        :reading="reading"
      />
    </div>
  </div>
</template>
