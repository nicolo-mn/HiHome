<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useSensorStore } from "@/stores/sensors";
import SensorCard from "@/components/cards/SensorCard.vue";
import BaseIcon from "@/components/BaseIcon.vue";

const auth = useAuthStore();
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
  <div class="flex flex-col gap-10 md:gap-12">
    <header class="flex justify-between items-center">
      <div class="flex items-baseline gap-3 md:gap-4">
        <span class="font-medium text-base text-gray-200 md:text-[20px]">
          Home
        </span>
        <span v-if="auth.homeId" class="hidden md:inline text-sm text-gray-500">
          {{ auth.homeId }}
        </span>
      </div>
      <div class="flex gap-2">
        <RouterLink
          to="/notifications"
          aria-label="Notifications"
          class="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-200 hover:bg-gray-600 transition-colors no-underline"
        >
          <BaseIcon name="bell" :size="22" />
        </RouterLink>
        <RouterLink
          to="/settings"
          aria-label="Settings"
          class="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-200 hover:bg-gray-600 transition-colors no-underline"
        >
          <BaseIcon name="user" :size="22" />
        </RouterLink>
      </div>
    </header>

    <section class="flex flex-col gap-3">
      <div
        class="flex items-baseline gap-3 font-medium text-[18px] md:text-[20px] text-gray-400"
      >
        <span>Overview</span>
        <span
          v-if="error"
          class="text-[13px] text-rose-500 font-normal normal-case"
        >
          Live updates unavailable: {{ error }}
        </span>
        <span
          v-else-if="!connected"
          class="text-[13px] text-gray-500 font-normal normal-case"
        >
          Connecting…
        </span>
      </div>
      <div
        v-if="sensorReadings.length"
        class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3"
      >
        <SensorCard
          v-for="reading in sensorReadings"
          :key="reading.sensorId"
          :reading="reading"
        />
      </div>
      <div v-else class="text-sm text-gray-500">
        Waiting for sensor readings…
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <div class="font-medium text-[18px] md:text-[20px] text-gray-400">
        Quick actions
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <RouterLink
          to="/components"
          class="h-14 rounded-[28px] md:rounded-[32px] bg-gray-800/50 border-2 border-gray-800 text-gray-200 font-medium text-[18px] md:text-[20px] flex items-center justify-center gap-1.5 hover:bg-gray-800/80 transition-colors no-underline"
        >
          <BaseIcon name="devices" :size="22" />
          Manage components
        </RouterLink>
        <RouterLink
          to="/chat"
          class="h-14 rounded-[28px] md:rounded-[32px] bg-yellow-500 text-gray-900 font-bold text-[18px] md:text-[20px] flex items-center justify-center gap-1.5 hover:bg-yellow-400 transition-colors no-underline"
        >
          <BaseIcon name="assistant" :size="22" />
          Open chat assistant
        </RouterLink>
      </div>
    </section>

    <div class="h-8" />
  </div>
</template>
