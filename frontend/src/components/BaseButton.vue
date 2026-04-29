<script setup lang="ts">
defineProps<{
  label: string;
  loading?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="w-full py-3 rounded-xl bg-blue-50 border border-blue-200 text-gray-600 font-medium hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {{ loading ? "Loading..." : label }}
  </button>
</template>
