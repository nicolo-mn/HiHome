<script setup lang="ts">
defineProps<{
  icon: string;
  name: string;
}>();
</script>

<template>
  <div
    class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated border border-border"
  >
    <span class="w-5 h-5 block shrink-0" v-html="icon" />
    <span class="flex-1 text-body text-sm truncate">{{ name }}</span>
    <slot name="actions" />
  </div>
</template>
