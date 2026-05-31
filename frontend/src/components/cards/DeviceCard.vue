<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import BaseIcon from "@/components/BaseIcon.vue";
import BaseToggle from "@/components/BaseToggle.vue";
import { ACCENT } from "@/utils/accents";
import type { Accent, IconName } from "@/types/ui";
import type {
  HomeDevice,
  ToggleableDevice,
  ThermostatDevice,
  FanDevice,
  FanMode,
} from "@/api/devices";
import { FAN_MODES } from "@/api/devices";

const MIN_SETPOINT = 10;
const MAX_SETPOINT = 30;

const props = defineProps<{
  device: HomeDevice;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle", device: ToggleableDevice, nextValue: boolean): void;
  (e: "step", device: ThermostatDevice, direction: "up" | "down"): void;
  (e: "fan-mode", device: FanDevice, mode: FanMode): void;
}>();

const TYPE_META: Record<
  HomeDevice["type"],
  { icon: IconName; accent: Accent }
> = {
  light: { icon: "lamp", accent: "yellow" },
  window: { icon: "window", accent: "emerald" },
  thermostat: { icon: "device_thermostat", accent: "orange" },
  lock: { icon: "lock", accent: "blue" },
  fan: { icon: "fan", accent: "sky" },
  unknown: { icon: "info", accent: "sky" },
};

const meta = computed(() => TYPE_META[props.device.type]);
const accentClasses = computed(() => ACCENT[meta.value.accent]);

const isOn = computed(() => {
  if (
    props.device.type === "light" ||
    props.device.type === "window" ||
    props.device.type === "lock"
  ) {
    return (props.device as ToggleableDevice).state;
  }
  if (props.device.type === "fan") {
    return (props.device as FanDevice).mode !== "off";
  }
  return true;
});

const isToggle = computed(
  () =>
    props.device.type === "light" ||
    props.device.type === "window" ||
    props.device.type === "lock",
);

const cardClasses = computed(() => {
  if (props.device.type === "unknown") {
    return "bg-gray-800/50 border-2 border-gray-800";
  }
  if (isOn.value) {
    return `${accentClasses.value.tint} border-0`;
  }
  return "bg-gray-800/50 border-2 border-gray-800";
});

const iconClasses = computed(() =>
  props.device.type === "unknown" || !isOn.value
    ? "text-gray-500"
    : accentClasses.value.text,
);
const titleClasses = computed(() =>
  props.device.type === "unknown" || !isOn.value
    ? "text-white"
    : accentClasses.value.text,
);
const subtitleClasses = computed(() =>
  props.device.type === "unknown" || !isOn.value
    ? "text-gray-500"
    : `${accentClasses.value.text} opacity-80`,
);

const subtitle = computed(() => props.device.roomName ?? "");

const isThermostat = computed(() => props.device.type === "thermostat");
const wrapControls = ref(false);
const rowRef = ref<HTMLDivElement | null>(null);
const iconRef = ref<HTMLDivElement | null>(null);
const titleMeasureRef = ref<HTMLSpanElement | null>(null);
const subtitleMeasureRef = ref<HTMLSpanElement | null>(null);
const controlRef = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

function measureWrap() {
  if (!isThermostat.value) {
    wrapControls.value = false;
    return;
  }
  const row = rowRef.value;
  const icon = iconRef.value;
  const control = controlRef.value;
  if (!row || !icon || !control) return;

  const style = getComputedStyle(row);
  const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
  const titleWidth = titleMeasureRef.value?.offsetWidth ?? 0;
  const subtitleWidth = subtitleMeasureRef.value?.offsetWidth ?? 0;
  const textWidth = Math.max(titleWidth, subtitleWidth);
  const needed = icon.offsetWidth + gap + textWidth + gap + control.offsetWidth;
  wrapControls.value = needed > row.clientWidth;
}

onMounted(() => {
  nextTick(measureWrap);
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => measureWrap());
    if (rowRef.value) resizeObserver.observe(rowRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch([() => props.device.name, subtitle, () => props.device.type], () => {
  nextTick(measureWrap);
});

const canDecrease = computed(
  () =>
    !props.busy &&
    props.device.type === "thermostat" &&
    (props.device as ThermostatDevice).setpoint > MIN_SETPOINT,
);
const canIncrease = computed(
  () =>
    !props.busy &&
    props.device.type === "thermostat" &&
    (props.device as ThermostatDevice).setpoint < MAX_SETPOINT,
);

function onToggle(next: boolean) {
  if (
    props.device.type === "light" ||
    props.device.type === "window" ||
    props.device.type === "lock"
  ) {
    emit("toggle", props.device as ToggleableDevice, next);
  }
}

function onStep(direction: "up" | "down") {
  if (props.device.type === "thermostat") {
    emit("step", props.device as ThermostatDevice, direction);
  }
}

function onSetFanMode(event: Event) {
  if (props.device.type !== "fan") return;
  const mode = (event.target as HTMLSelectElement).value as FanMode;
  emit("fan-mode", props.device as FanDevice, mode);
}

const FAN_MODE_OPTIONS = FAN_MODES;
</script>

<template>
  <div
    :class="[
      'min-h-[100px] md:min-h-[104px] rounded-[26px] md:rounded-[32px] px-5 md:px-6 py-4 flex flex-col gap-2 overflow-hidden transition-colors',
      cardClasses,
      busy ? 'opacity-75' : '',
    ]"
  >
    <div ref="rowRef" class="flex flex-wrap items-center gap-3 w-full">
      <div
        ref="iconRef"
        class="w-12 md:w-14 h-12 md:h-14 flex items-center justify-center shrink-0"
        :class="iconClasses"
      >
        <BaseIcon :name="meta.icon" :size="36" />
      </div>

      <div class="relative flex flex-col gap-1 min-w-0 flex-1">
        <span
          :class="[
            'font-bold text-[19px] md:text-[20px] leading-6',
            wrapControls ? 'break-words whitespace-normal' : 'truncate',
            titleClasses,
          ]"
        >
          {{ device.name }}
        </span>
        <span
          v-if="subtitle"
          :class="[
            'text-[15px] md:text-[16px] leading-[22px] tracking-tight',
            wrapControls ? 'break-words whitespace-normal' : 'truncate',
            subtitleClasses,
          ]"
        >
          {{ subtitle }}
        </span>
        <span
          ref="titleMeasureRef"
          aria-hidden="true"
          class="absolute -z-10 opacity-0 pointer-events-none whitespace-nowrap font-bold text-[19px] md:text-[20px] leading-6"
        >
          {{ device.name }}
        </span>
        <span
          v-if="subtitle"
          ref="subtitleMeasureRef"
          aria-hidden="true"
          class="absolute -z-10 opacity-0 pointer-events-none whitespace-nowrap text-[15px] md:text-[16px] leading-[22px] tracking-tight"
        >
          {{ subtitle }}
        </span>
      </div>

      <BaseToggle
        v-if="isToggle"
        :model-value="isOn"
        :accent="meta.accent"
        :disabled="busy"
        :aria-label="`Toggle ${device.name}`"
        @update:model-value="onToggle"
      />

      <div
        v-else-if="device.type === 'thermostat'"
        ref="controlRef"
        :class="[wrapControls ? 'basis-full justify-end' : 'ml-auto']"
        class="flex items-center gap-1.5"
      >
        <button
          type="button"
          :disabled="!canDecrease"
          class="w-9 h-9 rounded-2xl bg-white/[0.08] flex items-center justify-center text-gray-200 hover:bg-white/[0.14] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :aria-label="`Decrease ${device.name}`"
          @click="onStep('down')"
        >
          <BaseIcon name="remove" :size="18" />
        </button>
        <span
          class="font-medium text-[16px] md:text-[18px] tabular-nums w-16 text-center"
          :class="accentClasses.text"
        >
          {{ (device as ThermostatDevice).setpoint.toFixed(1)
          }}{{ (device as ThermostatDevice).unit }}
        </span>
        <button
          type="button"
          :disabled="!canIncrease"
          class="w-9 h-9 rounded-2xl bg-white/[0.08] flex items-center justify-center text-gray-200 hover:bg-white/[0.14] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :aria-label="`Increase ${device.name}`"
          @click="onStep('up')"
        >
          <BaseIcon name="add" :size="18" />
        </button>
      </div>

      <select
        v-else-if="device.type === 'fan'"
        class="ml-auto bg-white/[0.08] text-gray-200 rounded-2xl px-3 py-2 text-sm font-medium capitalize outline-none border-0 disabled:opacity-40"
        :disabled="busy"
        :value="(device as FanDevice).mode"
        :aria-label="`Set fan mode for ${device.name}`"
        @change="onSetFanMode"
      >
        <option
          v-for="opt in FAN_MODE_OPTIONS"
          :key="opt"
          :value="opt"
          class="bg-gray-900 text-gray-200"
        >
          {{ opt }}
        </option>
      </select>

      <span
        v-else
        class="text-xs uppercase tracking-wider text-gray-500 font-semibold"
      >
        unsupported
      </span>
    </div>
  </div>
</template>
