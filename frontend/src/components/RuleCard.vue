<script setup lang="ts">
import type { RuleDto } from "@/api/rules";
import type { HomeComponent } from "@/api/components";

const props = defineProps<{
  rule: RuleDto;
  components?: HomeComponent[];
}>();

defineEmits<{ delete: [] }>();

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
    <div class="flex items-center justify-between">
      <h3 class="text-base font-medium text-primary">{{ rule.name }}</h3>
      <button
        type="button"
        class="text-xs text-muted hover:text-red-400 transition"
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
