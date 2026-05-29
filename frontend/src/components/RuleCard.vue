<script setup lang="ts">
import BaseIcon from "@/components/BaseIcon.vue";
import { ACCENT } from "@/utils/accents";
import type { RuleDto } from "@/api/rules";
import type { HomeDevice } from "@/api/devices";

const props = defineProps<{
  rule: RuleDto;
  devices?: HomeDevice[];
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  reorderDisabled?: boolean;
}>();

defineEmits<{
  delete: [];
  "move-up": [];
  "move-down": [];
}>();

const CONDITION_LABELS: Record<string, string> = {
  "indoor-thermometer": "Indoor temperature",
  "outdoor-thermometer": "Outdoor temperature",
  "wind-speed": "Wind speed",
  "air-quality": "Air quality",
  weather: "Weather",
};

const CONDITION_UNITS: Record<string, string> = {
  "indoor-thermometer": "°C",
  "outdoor-thermometer": "°C",
  "wind-speed": " m/s",
  "air-quality": " AQI",
};

const OPERATOR_LABELS: Record<string, string> = {
  gt: ">",
  lt: "<",
  eq: "=",
  is: "is",
};

const ACTION_LABELS: Record<string, string> = {
  "light-turn-on": "Turn on light",
  "light-turn-off": "Turn off light",
  "window-open": "Open window",
  "window-close": "Close window",
  "thermostat-set-temperature": "Set thermostat",
  "lock-lock": "Lock",
  "lock-unlock": "Unlock",
  "fan-set-mode": "Set fan mode",
};

const accent = ACCENT.yellow;

function conditionSummary(rule: RuleDto): string {
  const sensor = CONDITION_LABELS[rule.condition.type] ?? rule.condition.type;
  const op =
    OPERATOR_LABELS[rule.condition.operator] ?? rule.condition.operator;
  const unit = CONDITION_UNITS[rule.condition.type] ?? "";
  return `${sensor} ${op} ${rule.condition.target}${unit}`;
}

function actionSummary(action: RuleDto["actions"][number]): string {
  const label = ACTION_LABELS[action.type] ?? action.type;
  if (action.targetTemperature !== undefined) {
    return `${label} to ${action.targetTemperature}°C`;
  }
  if (action.mode !== undefined) {
    return `${label} to ${action.mode}`;
  }
  return label;
}

function getDeviceName(deviceId: string): string {
  const device = props.devices?.find((c) => c.id === deviceId);
  return device?.name ?? deviceId;
}
</script>

<template>
  <div
    :class="[
      'rounded-[26px] md:rounded-[32px] p-4 md:p-5 flex flex-col gap-3',
      accent.tint,
    ]"
  >
    <div class="flex items-center gap-3">
      <div class="flex flex-col">
        <button
          type="button"
          class="text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition leading-none text-sm"
          :disabled="!canMoveUp || reorderDisabled"
          aria-label="Move rule up"
          @click="$emit('move-up')"
        >
          ▲
        </button>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition leading-none text-sm"
          :disabled="!canMoveDown || reorderDisabled"
          aria-label="Move rule down"
          @click="$emit('move-down')"
        >
          ▼
        </button>
      </div>
      <div
        class="w-11 h-11 rounded-2xl bg-gray-900/40 flex items-center justify-center shrink-0"
        :class="accent.text"
      >
        <BaseIcon name="bolt" :size="22" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 tabular-nums shrink-0">
            #{{ rule.order + 1 }}
          </span>
          <h3
            class="text-[17px] md:text-[19px] font-bold text-gray-200 truncate"
          >
            {{ rule.name }}
          </h3>
        </div>
        <p class="text-sm text-gray-400 mt-0.5 truncate">
          <span class="font-semibold" :class="accent.text">When</span>
          {{ conditionSummary(rule) }}
        </p>
      </div>
      <button
        type="button"
        class="w-9 h-9 rounded-2xl text-gray-400 hover:text-rose-400 hover:bg-white/5 flex items-center justify-center shrink-0"
        aria-label="Delete rule"
        @click="$emit('delete')"
      >
        <BaseIcon name="trash" :size="18" />
      </button>
    </div>

    <div class="flex flex-wrap gap-2 pl-1">
      <span
        v-for="(action, i) in rule.actions"
        :key="i"
        class="text-xs bg-gray-900/40 rounded-xl px-3 py-1.5 text-gray-300 font-medium"
      >
        {{ actionSummary(action) }}
        <span class="text-gray-500 ml-1">
          ({{ getDeviceName(action.deviceId) }})
        </span>
      </span>
    </div>
  </div>
</template>
