<script setup lang="ts">
import { computed } from "vue";
import { resolveSensorIcon } from "@/assets/icons";
import { ACCENT } from "@/utils/accents";
import type { Accent } from "@/types/ui";
import type { SensorReading } from "@/api/sensors";

const props = defineProps<{
  reading: SensorReading;
}>();

const SENSOR_LABEL: Record<string, string> = {
  thermometer: "Indoor temperature",
  airquality: "Outdoor air quality",
  outdoor_temperature: "Outdoor temperature",
  weather: "Weather",
  wind: "Wind",
};

const SENSOR_ACCENT: Record<string, Accent> = {
  thermometer: "orange",
  outdoor_temperature: "orange",
  airquality: "sky",
  weather: "sky",
  wind: "blue",
};

const icon = computed(() => resolveSensorIcon(props.reading));
const label = computed(
  () => SENSOR_LABEL[props.reading.type] ?? props.reading.type,
);
const accent = computed<Accent>(
  () => SENSOR_ACCENT[props.reading.type] ?? "sky",
);
const accentClasses = computed(() => ACCENT[accent.value]);

const displayValue = computed(() => {
  const v = props.reading.value;
  if (props.reading.type === "wind" && v && typeof v === "object") {
    const speed = (v as { speed?: unknown }).speed;
    const direction = (v as { direction?: unknown }).direction;
    const speedValue = typeof speed === "number" ? speed.toFixed(1) : null;
    const speedUnit = props.reading.measureUnit || "";
    const directionValue =
      typeof direction === "number"
        ? `${Math.round(direction)}°`
        : typeof direction === "string" && direction.trim()
          ? direction
          : null;

    if (speedValue && directionValue) {
      return `${speedValue} ${speedUnit} · ${directionValue}`.trim();
    }
    if (speedValue) return `${speedValue} ${speedUnit}`.trim();
  }

  if (typeof v === "number") return v.toFixed(1);
  if (typeof v === "string") return v;
  return "—";
});

const unitSymbol = computed(() => {
  if (props.reading.type === "wind") return "";
  const u = props.reading.measureUnit?.toLowerCase() ?? "";
  if (u === "celsius") return "°C";
  if (u === "fahrenheit") return "°F";
  if (u === "eaqi") return "AQI";
  if (!u) return "";
  return props.reading.measureUnit;
});
</script>

<template>
  <div
    :class="[
      'min-h-[100px] md:min-h-[104px] rounded-[26px] md:rounded-[32px] px-5 md:px-6 py-4 flex flex-row items-center gap-3 overflow-hidden',
      accentClasses.tint,
    ]"
  >
    <span
      class="w-12 md:w-14 h-12 md:h-14 flex items-center justify-center shrink-0"
      :class="accentClasses.text"
      v-html="icon"
    />
    <div class="flex flex-col gap-1 min-w-0 flex-1">
      <span
        class="font-bold text-[19px] md:text-[20px] leading-6 truncate"
        :class="accentClasses.text"
      >
        {{ label }}
      </span>
    </div>
    <span
      class="font-medium text-[20px] md:text-[24px] leading-7 tabular-nums shrink-0"
      :class="accentClasses.text"
    >
      {{ displayValue
      }}<span
        v-if="unitSymbol"
        class="text-base ml-1"
        :class="accentClasses.text"
        >{{ unitSymbol }}</span
      >
    </span>
  </div>
</template>
