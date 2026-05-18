<script setup lang="ts">
import type { NotificationDTO } from "@/api/notifications";
import bellIcon from "@/assets/icons/bell.svg?raw";

defineProps<{
  toasts: NotificationDTO[];
}>();

const emit = defineEmits<{
  (e: "dismiss", id: string): void;
}>();
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface border border-primary shadow-lg cursor-pointer"
        @click="emit('dismiss', toast.id)"
      >
        <span
          class="w-5 h-5 block shrink-0 text-primary mt-0.5"
          v-html="bellIcon"
        />
        <p class="text-body text-sm flex-1 min-w-0">{{ toast.message }}</p>
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
