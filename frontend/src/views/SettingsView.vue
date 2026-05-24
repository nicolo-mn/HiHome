<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { usePreferencesStore } from "@/stores/preferences";
import { useUsersStore } from "@/stores/users";
import {
  ALL_NOTIFICATION_TYPES,
  ALL_ROLES,
  ROLE_LABELS,
  TYPE_LABELS,
  type NotificationType,
  type RoleName,
  type UserSummary,
} from "@/api";

const authStore = useAuthStore();
const prefsStore = usePreferencesStore();
const usersStore = useUsersStore();
const router = useRouter();

const visibleNotificationTypes = computed<readonly NotificationType[]>(() =>
  authStore.isAdmin
    ? ALL_NOTIFICATION_TYPES
    : ALL_NOTIFICATION_TYPES.filter((t) => t !== "AutomationRuleExecuted"),
);

const manageableUsers = computed<UserSummary[]>(() =>
  usersStore.users.filter((u) => u.username !== authStore.username),
);

onMounted(() => {
  prefsStore.load();
  if (authStore.isAdmin) usersStore.load();
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

function onRoleChange(userId: string, ev: Event) {
  const target = ev.target as HTMLSelectElement;
  const role = target.value as RoleName;
  usersStore.changeRole(userId, role);
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

    <section
      v-if="authStore.isAdmin"
      class="rounded-2xl border border-border bg-surface p-4"
    >
      <h2 class="text-base font-semibold text-primary">User Management</h2>
      <p class="text-sm text-muted mb-3">
        Change the role of other users in this home.
      </p>

      <p
        v-if="usersStore.isLoading && manageableUsers.length === 0"
        class="text-sm text-muted py-2"
      >
        Loading users…
      </p>

      <p
        v-else-if="manageableUsers.length === 0"
        class="text-sm text-muted py-2"
      >
        No other users in this home.
      </p>

      <div
        v-for="user in manageableUsers"
        v-else
        :key="user.id"
        class="flex items-center justify-between py-2 border-t border-border first:border-t-0"
      >
        <span class="text-sm text-primary">{{ user.username }}</span>
        <select
          :value="user.role"
          :disabled="usersStore.isLoading"
          class="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-primary cursor-pointer"
          @change="onRoleChange(user.id, $event)"
        >
          <option v-for="role in ALL_ROLES" :key="role" :value="role">
            {{ ROLE_LABELS[role] }}
          </option>
        </select>
      </div>

      <p v-if="usersStore.error" class="text-sm text-danger mt-2">
        {{ usersStore.error }}
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
