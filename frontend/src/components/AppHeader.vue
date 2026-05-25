<script setup lang="ts">
/**
 * Per-view page header (title + optional back button + right-side actions).
 * Use at the top of each view's template; the AppLayout no longer renders
 * a global header.
 */
import { type PropType } from "vue";
import BaseIcon from "./BaseIcon.vue";
import type { IconName } from "@/types/ui";

export interface TopBarAction {
  icon: IconName;
  badge?: boolean;
  to?: string;
  label?: string;
}

defineProps({
  title: { type: String, required: true },
  large: { type: Boolean, default: true },
  rightActions: {
    type: Array as PropType<TopBarAction[]>,
    default: () => [],
  },
  showBack: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (e: "back"): void;
  (e: "action", index: number): void;
}>();
</script>

<template>
  <div
    class="w-full flex flex-row justify-between items-center gap-4 mb-6 md:mb-8"
  >
    <div class="flex flex-row items-center gap-3 md:gap-4 min-w-0 flex-1">
      <button
        v-if="showBack"
        type="button"
        class="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-700 text-gray-200 flex items-center justify-center shrink-0 hover:bg-gray-600 transition-colors"
        @click="emit('back')"
      >
        <BaseIcon name="back" :size="22" />
      </button>
      <h1
        :class="[
          'font-bold tracking-tight text-gray-200 truncate',
          large
            ? 'text-[32px] leading-[38px] sm:text-[40px] sm:leading-[46px] md:text-[48px] md:leading-[56px]'
            : 'text-[24px] leading-[30px] sm:text-[28px] sm:leading-[34px] md:text-[32px] md:leading-[40px]',
        ]"
      >
        {{ title }}
      </h1>
    </div>
    <div
      v-if="rightActions.length"
      class="flex flex-row gap-2 items-center shrink-0"
    >
      <template v-for="(a, i) in rightActions" :key="i">
        <RouterLink
          v-if="a.to"
          :to="a.to"
          :aria-label="a.label"
          class="relative w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-700 text-gray-200 flex items-center justify-center hover:bg-gray-600 transition-colors no-underline"
        >
          <BaseIcon :name="a.icon" :size="22" />
          <span
            v-if="a.badge"
            class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-gray-700 box-content"
          />
        </RouterLink>
        <button
          v-else
          type="button"
          :aria-label="a.label"
          class="relative w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-700 text-gray-200 flex items-center justify-center hover:bg-gray-600 transition-colors"
          @click="emit('action', i)"
        >
          <BaseIcon :name="a.icon" :size="22" />
          <span
            v-if="a.badge"
            class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-gray-700 box-content"
          />
        </button>
      </template>
    </div>
  </div>
</template>
