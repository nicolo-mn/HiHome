<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useNotificationsStore } from "@/stores/notifications";
import bellIcon from "@/assets/icons/bell.svg?raw";
import BaseButton from "@/components/BaseButton.vue";

const store = useNotificationsStore();
const { notifications, isLoading, error } = storeToRefs(store);

const TYPE_LABELS: Record<string, string> = {
  AirQualityThresholdBreach: "Air Quality Alert",
  AutomationRuleExecuted: "Automation",
  ComponentAction: "Component Action",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

onMounted(() => store.fetchAll());
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-light text-primary">Notifications</h1>

    <div v-if="error && notifications.length === 0" class="flex flex-col gap-2">
      <p class="text-danger text-sm">{{ error }}</p>
      <BaseButton label="Retry" @click="store.fetchAll()" />
    </div>
    <p v-else-if="error" class="text-danger text-sm">{{ error }}</p>

    <div
      v-if="isLoading && notifications.length === 0"
      class="text-muted text-sm"
    >
      Loading notifications…
    </div>

    <p
      v-if="!isLoading && !error && notifications.length === 0"
      class="text-muted text-sm"
    >
      No notifications yet.
    </p>

    <div class="flex flex-col gap-3">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="flex items-start gap-3 px-4 py-3 rounded-xl bg-elevated border border-border"
      >
        <span
          class="w-5 h-5 block shrink-0 text-primary mt-0.5"
          v-html="bellIcon"
        />
        <div class="flex-1 min-w-0">
          <span class="text-xs font-medium text-primary">{{
            typeLabel(n.type)
          }}</span>
          <p class="text-body text-sm mt-0.5">{{ n.message }}</p>
          <p class="text-muted text-xs mt-1">{{ formatDate(n.createdAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
