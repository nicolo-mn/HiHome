<script setup lang="ts">
import type { NotificationDTO } from "@/api/notifications";
import BaseIcon from "./BaseIcon.vue";

defineProps<{
  notification: NotificationDTO;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6"
    @click.self="emit('close')"
  >
    <div
      class="bg-gray-800 rounded-[28px] md:rounded-[32px] p-6 md:p-7 w-full max-w-[480px] max-h-[80vh] overflow-auto shadow-2xl"
    >
      <div class="flex items-start justify-between mb-5">
        <h2 class="text-xl md:text-2xl font-bold text-gray-200">
          Rules executed
        </h2>
        <button
          type="button"
          class="w-9 h-9 rounded-2xl text-gray-400 hover:bg-white/5 flex items-center justify-center"
          @click="emit('close')"
        >
          <BaseIcon name="close" :size="20" />
        </button>
      </div>

      <div v-if="notification.details" class="flex flex-col gap-5">
        <div
          v-for="execution in notification.details.executions"
          :key="execution.ruleName"
          class="flex flex-col gap-2"
        >
          <p
            class="text-sm font-semibold text-yellow-500 uppercase tracking-wider"
          >
            {{ execution.ruleName }}
          </p>
          <ul class="flex flex-col gap-1.5 pl-1">
            <li
              v-for="(action, i) in execution.actions"
              :key="i"
              class="flex items-start gap-2 text-[15px] text-gray-200"
            >
              <span class="text-gray-500 mt-1">•</span>
              <span>{{ action }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
