<script setup lang="ts">
defineProps<{
  icon?: string;
  label: string;
  value: string;
  unit?: string;
  subtitle?: string;
}>();
</script>

<template>
  <div
    class="relative flex flex-col gap-2 px-5 py-5 rounded-[26px] md:rounded-[32px] bg-gray-800/50 border-2 border-gray-800 transition hover:bg-gray-800/70"
  >
    <span
      v-if="icon"
      class="absolute top-4 right-4 w-6 h-6 text-white"
      v-html="icon"
    />
    <span class="text-xs uppercase tracking-wide text-white font-medium">
      {{ label }}
    </span>
    <div class="flex items-baseline gap-1">
      <span class="text-3xl font-bold text-gray-200 leading-none tabular-nums">
        {{ value }}
      </span>
      <span v-if="unit" class="text-sm text-white">{{ unit }}</span>
    </div>
    <span v-if="subtitle" class="text-xs text-gray-500">{{ subtitle }}</span>
    <slot />
  </div>
</template>
