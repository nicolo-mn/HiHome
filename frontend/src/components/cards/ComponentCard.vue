<script setup lang="ts">
import ToggleCard from "./ToggleCard.vue";
import StepperCard from "./StepperCard.vue";
import { componentTypeIcon } from "../../assets/icons";
import type {
  HomeComponent,
  ToggleableComponent,
  ThermostatComponent,
  ToggleableType,
} from "../../api/components";

const toggleableTypes = new Set<ToggleableType>(["light", "window"]);

const props = defineProps<{
  component: HomeComponent;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle", component: ToggleableComponent, nextValue: boolean): void;
  (e: "step", component: ThermostatComponent, direction: "up" | "down"): void;
}>();

const icon = componentTypeIcon[props.component.type] ?? "";
</script>

<template>
  <ToggleCard
    v-if="toggleableTypes.has(component.type as ToggleableType)"
    :component="component as ToggleableComponent"
    :icon="icon"
    :busy="busy"
    @toggle="(c, next) => emit('toggle', c, next)"
  />
  <StepperCard
    v-else-if="component.type === 'thermostat'"
    :component="component as ThermostatComponent"
    :icon="icon"
    :busy="busy"
    @step="(c, dir) => emit('step', c, dir)"
  />
  <div
    v-else
    class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-border opacity-60"
  >
    <span class="flex-1 text-body text-sm truncate">{{ component.name }}</span>
    <span class="text-muted text-xs">unsupported</span>
  </div>
</template>
