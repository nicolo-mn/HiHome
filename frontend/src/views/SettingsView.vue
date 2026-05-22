<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { usePreferencesStore } from "@/stores/preferences";
import {
  ALL_NOTIFICATION_TYPES,
  TYPE_LABELS,
  type NotificationType,
} from "@/api";

const authStore = useAuthStore();
const prefsStore = usePreferencesStore();
const router = useRouter();

const visibleNotificationTypes = computed<readonly NotificationType[]>(() =>
  authStore.isAdmin
    ? ALL_NOTIFICATION_TYPES
    : ALL_NOTIFICATION_TYPES.filter((t) => t !== "AutomationRuleExecuted"),
);

onMounted(() => {
  prefsStore.load();
});

function onLogout() {
  authStore.logout();
  router.push({ name: "login" });
}

function onToggle(type: NotificationType, checked: boolean) {
  const current = prefsStore.preferences;
  const updated = checked
    ? ([...current, type] as NotificationType[])
    : current.filter((t) => t !== type);
  prefsStore.update(updated);
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-primary">Settings</h1>

    <section class="rounded-2xl border border-border bg-surface p-4">
      <h2 class="text-base font-semibold text-primary">
        Notification Preferences
      </h2>
      <p class="text-sm text-muted mb-3">
        Choose which notifications you receive.
      </p>

      <div
        v-for="type in visibleNotificationTypes"
        :key="type"
        class="flex items-center justify-between py-2 border-t border-border first:border-t-0"
      >
        <span class="text-sm text-primary">{{ TYPE_LABELS[type] }}</span>
        <input
          type="checkbox"
          :checked="prefsStore.preferences.includes(type)"
          :disabled="prefsStore.isLoading"
          class="h-4 w-4 accent-primary cursor-pointer"
          @change="onToggle(type, ($event.target as HTMLInputElement).checked)"
        />
      </div>

      <p v-if="prefsStore.error" class="text-sm text-danger mt-2">
        {{ prefsStore.error }}
      </p>
    </section>

    <section class="rounded-2xl border border-border bg-surface p-4">
      <h2 class="text-base font-semibold text-primary">Account</h2>
      <p class="text-sm text-muted">
        Signed in as {{ authStore.username ?? "User" }}
      </p>

      <button
        type="button"
        class="mt-4 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-elevated transition"
        @click="onLogout"
      >
        Logout
      </button>
    </section>
  </div>
</template>
