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
    class="relative flex flex-col gap-2 px-5 py-5 rounded-2xl bg-elevated border border-border transition hover:border-primary/60 hover:shadow-lg"
  >
    <span
      v-if="icon"
      class="absolute top-4 right-4 w-6 h-6 text-primary opacity-70"
      v-html="icon"
    />
    <span class="text-xs uppercase tracking-wide text-muted">
      {{ label }}
    </span>
    <div class="flex items-baseline gap-1">
      <span class="text-3xl font-light text-primary leading-none">
        {{ value }}
      </span>
      <span v-if="unit" class="text-sm text-muted">{{ unit }}</span>
    </div>
    <span v-if="subtitle" class="text-xs text-muted">{{ subtitle }}</span>
    <slot />
  </div>
</template>
