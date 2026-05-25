<script setup lang="ts">
import { computed } from "vue";
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
  light: { icon: "bolt", accent: "yellow" },
  window: { icon: "swap", accent: "emerald" },
  thermostat: { icon: "device_thermostat", accent: "orange" },
  unknown: { icon: "info", accent: "sky" },
};

const meta = computed(() => TYPE_META[props.component.type]);
const accentClasses = computed(() => ACCENT[meta.value.accent]);

const isOn = computed(() => {
  if (props.component.type === "light" || props.component.type === "window") {
    return (props.component as ToggleableComponent).state;
  }
  return true;
});

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
  if (props.component.type === "light" || props.component.type === "window") {
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
      'h-[100px] md:h-[104px] rounded-[26px] md:rounded-[32px] px-5 md:px-6 flex flex-row items-center gap-3 overflow-hidden transition-colors',
      cardClasses,
      busy ? 'opacity-75' : '',
    ]"
  >
    <div
      class="w-12 md:w-14 h-12 md:h-14 flex items-center justify-center shrink-0"
      :class="iconClasses"
    >
      <BaseIcon :name="meta.icon" :size="36" />
    </div>

    <div class="flex flex-col gap-1 min-w-0 flex-1">
      <span
        :class="[
          'font-bold text-[19px] md:text-[20px] leading-6 truncate',
          titleClasses,
        ]"
      >
        {{ component.name }}
      </span>
      <span
        v-if="subtitle"
        :class="[
          'text-[15px] md:text-[16px] leading-[22px] tracking-tight truncate',
          subtitleClasses,
        ]"
      >
        {{ subtitle }}
      </span>
    </div>

    <BaseToggle
      v-if="component.type === 'light' || component.type === 'window'"
      :model-value="isOn"
      :accent="meta.accent"
      :disabled="busy"
      :aria-label="`Toggle ${component.name}`"
      @update:model-value="onToggle"
    />

    <div
      v-else-if="component.type === 'thermostat'"
      class="flex items-center gap-1.5 shrink-0"
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
</template>
