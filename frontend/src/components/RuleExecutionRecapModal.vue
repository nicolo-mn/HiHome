<script setup lang="ts">
import type { NotificationDTO } from "@/api/notifications";

defineProps<{
  notification: NotificationDTO;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="emit('close')"
  >
    <div
      class="bg-surface border border-border rounded-xl p-6 max-w-md w-[90%] max-h-[80vh] overflow-auto"
    >
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-lg font-medium text-primary">Rules executed</h2>
        <button
          class="text-muted hover:text-primary text-xl leading-none"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div v-if="notification.details" class="flex flex-col gap-4">
        <div
          v-for="execution in notification.details.executions"
          :key="execution.ruleName"
          class="flex flex-col gap-1"
        >
          <p class="text-sm font-medium text-primary">
            {{ execution.ruleName }}:
          </p>
          <ul class="list-disc pl-6 text-sm text-body">
            <li v-for="(action, i) in execution.actions" :key="i">
              {{ action }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
