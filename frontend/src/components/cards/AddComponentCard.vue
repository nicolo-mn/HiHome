<script setup lang="ts">
import plusIcon from "../../assets/icons/plus.svg?raw";

defineProps<{
  disabled?: boolean;
}>();

defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-border border-dashed text-muted hover:text-primary hover:border-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
    @click="$emit('click')"
  >
    <span class="flex-1 text-left text-sm">Add Component</span>
    <span
      class="inline-flex items-center justify-center w-5 h-5 rounded border border-current"
    >
      <span class="w-3 h-3 block" v-html="plusIcon" />
    </span>
  </button>
</template>
