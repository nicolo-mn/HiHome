<script setup lang="ts">
import { computed } from "vue";
import { resolveSensorIcon } from "@/assets/icons";
import type { SensorReading } from "@/api/sensors";

const props = defineProps<{
  reading: SensorReading;
}>();

const sensorTypeLabel: Record<string, string> = {
  thermometer: "Thermometer",
  airquality: "Air Quality",
  outdoor_temperature: "Outdoor Temp",
  outdoor_airquality: "Outdoor Air Quality",
  weather: "Weather",
};

const icon = computed(() => resolveSensorIcon(props.reading));

const label = computed(
  () => sensorTypeLabel[props.reading.type] ?? props.reading.type,
);

const displayValue = computed(() => {
  const v = props.reading.value;
  if (typeof v === "number") return v.toFixed(1);
  if (typeof v === "string") return v;
  return "—";
});

const unitSymbol = computed(() => {
  const u = props.reading.measureUnit?.toLowerCase() ?? "";
  if (u === "celsius") return "°C";
  if (u === "fahrenheit") return "°F";
  if (!u || u === "eaqi") return "";
  return props.reading.measureUnit;
});
</script>

<template>
  <div
    class="flex items-center gap-5 px-5 py-5 rounded-2xl bg-elevated border border-primary"
  >
    <span class="w-14 h-14 block text-primary shrink-0" v-html="icon" />
    <p class="flex-1 text-body text-xl font-semibold truncate">
      {{ label }}
    </p>
    <p
      class="text-primary text-3xl font-semibold tabular-nums leading-tight shrink-0"
    >
      {{ displayValue
      }}<span v-if="unitSymbol" class="text-lg ml-1 text-muted font-normal">{{
        unitSymbol
      }}</span>
    </p>
  </div>
</template>
