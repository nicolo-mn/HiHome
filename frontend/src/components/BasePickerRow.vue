<script setup lang="ts">
import { type PropType } from "vue";
import BaseIcon from "./BaseIcon.vue";
import { ACCENT } from "@/utils/accents";
import type { IconName, Accent } from "@/types/ui";

defineProps({
  prefix: { type: String, required: true },
  icon: { type: String as PropType<IconName>, required: true },
  accent: { type: String as PropType<Accent>, default: "sky" },
  value: {
    type: [String, Number] as PropType<string | number>,
    required: true,
  },
  suffix: { type: String, default: "" },
  sub: { type: String, default: "" },
});

defineEmits<{ (e: "open"): void }>();
</script>

<template>
  <button
    type="button"
    class="w-full h-[72px] rounded-2xl bg-gray-900/50 px-4 py-2 flex flex-row items-center gap-3.5 text-left hover:bg-gray-900/80 transition-colors"
    @click="$emit('open')"
  >
    <div
      class="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0"
      :class="ACCENT[accent].text"
    >
      <BaseIcon :name="icon" :size="22" />
    </div>
    <div class="flex flex-col flex-1 min-w-0">
      <span
        class="text-[12px] font-medium uppercase tracking-wider text-gray-400"
      >
        {{ prefix }}
      </span>
      <span
        class="text-[18px] md:text-[19px] font-semibold text-gray-200 flex items-baseline gap-2 truncate"
      >
        {{ value }}
        <span v-if="suffix" class="font-mono text-[16px] text-gray-400">
          {{ suffix }}
        </span>
        <span v-if="sub" class="text-sm text-gray-400 font-normal">
          · {{ sub }}
        </span>
      </span>
    </div>
    <BaseIcon name="chevron_right" :size="22" class="text-gray-500" />
  </button>
</template>
