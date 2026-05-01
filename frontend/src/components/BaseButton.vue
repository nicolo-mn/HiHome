<script setup lang="ts">
defineProps<{
  label: string;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}>();
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    class="w-full py-3 rounded-xl bg-elevated border border-border text-primary font-medium hover:bg-base transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {{ loading ? "Loading..." : label }}
  </button>
</template>
