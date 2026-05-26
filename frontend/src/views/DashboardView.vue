<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useSensorStore } from "@/stores/sensors";
import SensorCard from "@/components/cards/SensorCard.vue";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";

const auth = useAuthStore();
const sensorStore = useSensorStore();
const { readings } = storeToRefs(sensorStore);

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

const outdoorReadings = computed(() =>
  sensorReadings.value.filter((r) =>
    ["weather", "outdoor_temperature", "airquality", "wind"].includes(r.type),
  ),
);

const indoorReadings = computed(() =>
  sensorReadings.value.filter((r) => r.type === "thermometer"),
);

const weatherCard = computed(() =>
  outdoorReadings.value.find((r) => r.type === "weather"),
);

const otherOutdoorCards = computed(() =>
  outdoorReadings.value.filter((r) => r.type !== "weather"),
);
</script>

<template>
  <div class="flex flex-col gap-10 md:gap-12">
    <AppHeader
      title="Home"
      :right-actions="[
        { icon: 'bell', label: 'Notifications', to: '/notifications' },
        { icon: 'user', label: 'Settings', to: '/settings' },
      ]"
    />

    <section v-if="outdoorReadings.length" class="flex flex-col gap-3">
      <div class="font-medium text-[18px] md:text-[20px] text-gray-400">
        Outdoor
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <SensorCard
          v-if="weatherCard"
          :key="weatherCard.sensorId"
          :reading="weatherCard"
        />
        <div class="flex flex-col gap-2 md:gap-3">
          <SensorCard
            v-for="reading in otherOutdoorCards"
            :key="reading.sensorId"
            :reading="reading"
          />
        </div>
      </div>
    </section>

    <section v-if="indoorReadings.length" class="flex flex-col gap-3">
      <div class="font-medium text-[18px] md:text-[20px] text-gray-400">
        Indoor
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <SensorCard
          v-for="reading in indoorReadings"
          :key="reading.sensorId"
          :reading="reading"
        />
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
          Manage devices
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
