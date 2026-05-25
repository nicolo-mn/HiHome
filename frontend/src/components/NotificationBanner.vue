<script setup lang="ts">
import type { NotificationDTO } from "@/api/notifications";
import BaseIcon from "./BaseIcon.vue";

defineProps<{
  toasts: NotificationDTO[];
}>();

const emit = defineEmits<{
  (e: "dismiss", id: string): void;
}>();
</script>

<template>
  <div
    class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl bg-gray-800 border border-yellow-500/30 shadow-2xl cursor-pointer"
        @click="emit('dismiss', toast.id)"
      >
        <span
          class="w-9 h-9 rounded-2xl bg-yellow-500/15 text-yellow-500 flex items-center justify-center shrink-0"
        >
          <BaseIcon name="bell" :size="20" />
        </span>
        <p class="text-gray-200 text-sm flex-1 min-w-0 leading-snug">
          {{ toast.message }}
        </p>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
