<script setup lang="ts">
import BaseIcon from "@/components/BaseIcon.vue";

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
    class="h-[100px] md:h-[104px] rounded-[26px] md:rounded-[32px] border-2 border-dashed border-gray-800 text-gray-300 font-semibold text-base md:text-lg flex items-center justify-center gap-2 hover:bg-white/[0.02] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    @click="$emit('click')"
  >
    <BaseIcon name="add" :size="22" />
    Add component
  </button>
</template>
