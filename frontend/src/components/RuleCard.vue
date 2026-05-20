<script setup lang="ts">
import type { RuleDto } from "@/api/rules";
import type { HomeComponent } from "@/api/components";

const props = defineProps<{
  rule: RuleDto;
  components?: HomeComponent[];
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
  "internal-thermometer": "Internal temperature",
  "external-thermometer": "External temperature",
  "wind-speed": "Wind speed",
  "air-quality": "Air quality",
  weather: "Weather",
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
};

function conditionSummary(rule: RuleDto): string {
  const sensor = CONDITION_LABELS[rule.condition.type] ?? rule.condition.type;
  const op =
    OPERATOR_LABELS[rule.condition.operator] ?? rule.condition.operator;
  return `${sensor} ${op} ${rule.condition.target}`;
}

function actionSummary(action: RuleDto["actions"][number]): string {
  const label = ACTION_LABELS[action.type] ?? action.type;
  if (action.targetTemperature !== undefined) {
    return `${label} to ${action.targetTemperature}°C`;
  }
  return label;
}

function getComponentName(componentId: string): string {
  const component = props.components?.find((c) => c.id === componentId);
  return component?.name ?? componentId;
}
</script>

<template>
  <div
    class="bg-surface border border-border rounded-2xl p-4 md:p-5 flex flex-col gap-2"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <div class="flex flex-col">
          <button
            type="button"
            class="text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition leading-none"
            :disabled="!canMoveUp || reorderDisabled"
            aria-label="Move rule up"
            @click="$emit('move-up')"
          >
            ▲
          </button>
          <button
            type="button"
            class="text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition leading-none"
            :disabled="!canMoveDown || reorderDisabled"
            aria-label="Move rule down"
            @click="$emit('move-down')"
          >
            ▼
          </button>
        </div>
        <span class="text-xs text-muted w-6 text-center"
          >#{{ rule.order + 1 }}</span
        >
        <h3 class="text-base font-medium text-primary truncate">
          {{ rule.name }}
        </h3>
      </div>
      <button
        type="button"
        class="text-xs text-muted hover:text-red-400 transition shrink-0"
        @click="$emit('delete')"
      >
        Delete
      </button>
    </div>

    <p class="text-sm text-muted">
      <span class="text-primary font-medium">When</span>
      {{ conditionSummary(rule) }}
    </p>

    <div class="flex flex-wrap gap-2">
      <span
        v-for="(action, i) in rule.actions"
        :key="i"
        class="text-xs bg-elevated border border-border rounded-lg px-3 py-1 text-muted"
      >
        {{ actionSummary(action) }}
        <span class="text-primary/50 ml-1"
          >({{ getComponentName(action.componentId) }})</span
        >
      </span>
    </div>
  </div>
</template>
