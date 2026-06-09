<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  label: string;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
}>();

const variant = computed(() => props.variant ?? "primary");
const inactive = computed(() => props.disabled || props.loading);

const variantClass = computed(() => {
  if (variant.value === "secondary") {
    return "bg-gray-800/50 border-2 border-gray-800 text-gray-200 hover:bg-gray-800/80 disabled:opacity-60";
  }
  if (variant.value === "danger") {
    return inactive.value
      ? "bg-danger/25 text-white"
      : "bg-danger text-white hover:brightness-110";
  }
  return inactive.value
    ? "bg-yellow-500/25 text-white"
    : "bg-yellow-500 text-gray-900 hover:bg-yellow-400";
});
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :class="[
      'w-full h-14 md:h-16 rounded-[26px] md:rounded-[28px] font-bold text-[16px] md:text-[18px] tracking-tight flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed',
      variantClass,
    ]"
  >
    {{ loading ? "Loading…" : label }}
  </button>
</template>
