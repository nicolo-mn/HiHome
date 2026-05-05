<script setup lang="ts">
import { computed } from "vue";
import BaseCard from "./BaseCard.vue";
import thermometerIcon from "../../assets/icons/thermometer.svg?raw";
import airQualityIcon from "../../assets/icons/air-quality.svg?raw";
import type { SensorReading } from "../../composables/useSensorSocket";

// Add icons here for new sensor types.
const sensorIcons: Record<string, string> = {
  thermometer: thermometerIcon,
  airquality: airQualityIcon,
};

const props = defineProps<{
  reading: SensorReading;
}>();

const icon = computed(() => sensorIcons[props.reading.type] ?? thermometerIcon);

const label = computed(() => {
  if (props.reading.type === "thermometer") return "Thermometer";
  if (props.reading.type === "airquality") return "Air Quality";
  return props.reading.type;
});

const displayValue = computed(() => {
  const v = props.reading.value;
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toFixed(1);
  if (typeof v === "object") {
    const r = v as Record<string, unknown>;
    const inner = r.temperature ?? r.value;
    if (typeof inner === "number") return inner.toFixed(1);
  }
  return String(v);
});

const unitSymbol = computed(() => {
  const u = props.reading.measureUnit?.toLowerCase() ?? "";
  if (u === "celsius") return "°C";
  if (u === "fahrenheit") return "°F";
  return props.reading.measureUnit ?? "°C";
});
</script>

<template>
  <BaseCard :icon="icon" :name="label">
    <template #actions>
      <span class="text-primary text-sm font-medium tabular-nums">
        {{ displayValue }}{{ unitSymbol ? ` ${unitSymbol}` : "" }}
      </span>
    </template>
  </BaseCard>
</template>
