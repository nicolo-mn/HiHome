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
  HomeComponent,
  ToggleableComponent,
  ThermostatComponent,
} from "@/api/components";

const MIN_SETPOINT = 5;
const MAX_SETPOINT = 40;

const props = defineProps<{
  component: HomeComponent;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle", component: ToggleableComponent, nextValue: boolean): void;
  (e: "step", component: ThermostatComponent, direction: "up" | "down"): void;
}>();

const TYPE_META: Record<
  HomeComponent["type"],
  { icon: IconName; accent: Accent }
> = {
  light: { icon: "lamp", accent: "yellow" },
  window: { icon: "window", accent: "emerald" },
  thermostat: { icon: "device_thermostat", accent: "orange" },
  lock: { icon: "lock", accent: "blue" },
  unknown: { icon: "info", accent: "sky" },
};

const meta = computed(() => TYPE_META[props.component.type]);
const accentClasses = computed(() => ACCENT[meta.value.accent]);

const isOn = computed(() => {
  if (
    props.component.type === "light" ||
    props.component.type === "window" ||
    props.component.type === "lock"
  ) {
    return (props.component as ToggleableComponent).state;
  }
  return true;
});

const isToggle = computed(
  () =>
    props.component.type === "light" ||
    props.component.type === "window" ||
    props.component.type === "lock",
);

const cardClasses = computed(() => {
  if (props.component.type === "unknown") {
    return "bg-gray-800/50 border-2 border-gray-800";
  }
  if (isOn.value) {
    return `${accentClasses.value.tint} border-0`;
  }
  return "bg-gray-800/50 border-2 border-gray-800";
});

const iconClasses = computed(() =>
  props.component.type === "unknown" || !isOn.value
    ? "text-gray-500"
    : accentClasses.value.text,
);
const titleClasses = computed(() =>
  props.component.type === "unknown" || !isOn.value
    ? "text-gray-400"
    : accentClasses.value.text,
);
const subtitleClasses = computed(() =>
  props.component.type === "unknown" || !isOn.value
    ? "text-gray-500"
    : `${accentClasses.value.text} opacity-80`,
);

const subtitle = computed(() => props.component.roomName ?? "");

const isThermostat = computed(() => props.component.type === "thermostat");
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

watch(
  [() => props.component.name, subtitle, () => props.component.type],
  () => {
    nextTick(measureWrap);
  },
);

const canDecrease = computed(
  () =>
    !props.busy &&
    props.component.type === "thermostat" &&
    (props.component as ThermostatComponent).setpoint > MIN_SETPOINT,
);
const canIncrease = computed(
  () =>
    !props.busy &&
    props.component.type === "thermostat" &&
    (props.component as ThermostatComponent).setpoint < MAX_SETPOINT,
);

function onToggle(next: boolean) {
  if (
    props.component.type === "light" ||
    props.component.type === "window" ||
    props.component.type === "lock"
  ) {
    emit("toggle", props.component as ToggleableComponent, next);
  }
}

function onStep(direction: "up" | "down") {
  if (props.component.type === "thermostat") {
    emit("step", props.component as ThermostatComponent, direction);
  }
}
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
          {{ component.name }}
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
          {{ component.name }}
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
        :aria-label="`Toggle ${component.name}`"
        @update:model-value="onToggle"
      />

      <div
        v-else-if="component.type === 'thermostat'"
        ref="controlRef"
        :class="[wrapControls ? 'basis-full justify-end' : 'ml-auto']"
        class="flex items-center gap-1.5"
      >
        <button
          type="button"
          :disabled="!canDecrease"
          class="w-9 h-9 rounded-2xl bg-white/[0.08] flex items-center justify-center text-gray-200 hover:bg-white/[0.14] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :aria-label="`Decrease ${component.name}`"
          @click="onStep('down')"
        >
          <BaseIcon name="remove" :size="18" />
        </button>
        <span
          class="font-medium text-[16px] md:text-[18px] tabular-nums w-16 text-center"
          :class="accentClasses.text"
        >
          {{ (component as ThermostatComponent).setpoint.toFixed(1)
          }}{{ (component as ThermostatComponent).unit }}
        </span>
        <button
          type="button"
          :disabled="!canIncrease"
          class="w-9 h-9 rounded-2xl bg-white/[0.08] flex items-center justify-center text-gray-200 hover:bg-white/[0.14] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :aria-label="`Increase ${component.name}`"
          @click="onStep('up')"
        >
          <BaseIcon name="add" :size="18" />
        </button>
      </div>

      <span
        v-else
        class="text-xs uppercase tracking-wider text-gray-500 font-semibold"
      >
        unsupported
      </span>
    </div>
  </div>
</template>
