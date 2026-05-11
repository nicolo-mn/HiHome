<script setup lang="ts">
import BaseCard from "./BaseCard.vue";
import minusIcon from "../../assets/icons/minus.svg?raw";
import plusIcon from "../../assets/icons/plus.svg?raw";
import type { ThermostatComponent } from "../../api/components";

const props = defineProps<{
  component: ThermostatComponent;
  icon: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "step", component: ThermostatComponent, direction: "up" | "down"): void;
}>();
</script>

<template>
  <BaseCard :icon="icon" :name="component.name" :class="{ 'opacity-75': busy }">
    <template #actions>
      <div class="flex items-center gap-1">
        <button
          type="button"
          :disabled="busy"
          class="w-6 h-6 flex items-center justify-center rounded border border-border text-muted hover:text-primary hover:border-primary transition disabled:opacity-50"
          :aria-label="`Decrease ${component.name}`"
          @click="emit('step', component, 'down')"
        >
          <span class="w-3 h-3 block" v-html="minusIcon" />
        </button>
        <span
          class="text-primary text-sm font-medium tabular-nums w-14 text-center"
        >
          {{ component.setpoint.toFixed(1) }}&nbsp;{{ component.unit }}
        </span>
        <button
          type="button"
          :disabled="busy"
          class="w-6 h-6 flex items-center justify-center rounded border border-border text-muted hover:text-primary hover:border-primary transition disabled:opacity-50"
          :aria-label="`Increase ${component.name}`"
          @click="emit('step', component, 'up')"
        >
          <span class="w-3 h-3 block" v-html="plusIcon" />
        </button>
      </div>
    </template>
  </BaseCard>
</template>
