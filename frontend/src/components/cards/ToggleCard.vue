<script setup lang="ts">
import BaseCard from "./BaseCard.vue";
import BaseToggle from "../BaseToggle.vue";
import type { ToggleableComponent } from "../../api/components";

const props = defineProps<{
  component: ToggleableComponent;
  icon: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle", component: ToggleableComponent, nextValue: boolean): void;
}>();
</script>

<template>
  <BaseCard :icon="icon" :name="component.name" :class="{ 'opacity-75': busy }">
    <template #actions>
      <BaseToggle
        :model-value="component.state"
        :disabled="busy"
        :aria-label="`Toggle ${component.name}`"
        @update:model-value="emit('toggle', component, $event)"
      />
    </template>
  </BaseCard>
</template>
