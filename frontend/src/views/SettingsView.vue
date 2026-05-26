<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import BaseToggle from "@/components/BaseToggle.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { ACCENT } from "@/utils/accents";
import type { Accent, IconName } from "@/types/ui";

const authStore = useAuthStore();
const prefsStore = usePreferencesStore();
const usersStore = useUsersStore();
const router = useRouter();

const visibleNotificationTypes = computed<readonly NotificationType[]>(() =>
  authStore.isAdmin
    ? ALL_NOTIFICATION_TYPES
    : ALL_NOTIFICATION_TYPES.filter((t) => t !== "AutomationRuleExecuted"),
);

const NOTIF_META: Record<
  NotificationType,
  { icon: IconName; accent: Accent; desc: string }
> = {
  AirQualityThresholdBreach: {
    icon: "air",
    accent: "rose",
    desc: "Alert me when AQI rises above healthy thresholds.",
  },
  AutomationRuleExecuted: {
    icon: "bolt",
    accent: "yellow",
    desc: "Alert me every time an automation runs.",
  },
  ComponentAction: {
    icon: "devices",
    accent: "sky",
    desc: "Alert me when a device is turned on, off or adjusted.",
  },
};

const manageableUsers = computed<UserSummary[]>(() =>
  usersStore.users.filter((u) => u.username !== authStore.username),
);

const confirmLogout = ref(false);

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

const initial = computed(() =>
  (authStore.username ?? "U").charAt(0).toUpperCase(),
);
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-8">
    <AppHeader title="Settings" />

    <div class="max-w-[720px] flex flex-col gap-8">
      <section>
        <div class="font-medium text-[18px] md:text-[20px] text-gray-400 mb-3">
          Account
        </div>
        <div
          class="bg-gray-700 rounded-[28px] md:rounded-[32px] p-5 md:p-6 flex items-center gap-4"
        >
          <div
            class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-900 text-yellow-500 font-bold text-2xl md:text-3xl flex items-center justify-center shrink-0"
          >
            {{ initial }}
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="font-bold text-[20px] md:text-[22px] text-gray-200 truncate"
            >
              {{ authStore.username ?? "User" }}
            </div>
            <div class="text-[14px] md:text-[15px] text-gray-400 truncate">
              {{ authStore.homeId ?? "—" }} · {{ authStore.role ?? "" }}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="font-medium text-[18px] md:text-[20px] text-gray-400 mb-3">
          Notifications
        </div>
        <div
          class="bg-gray-800/50 border-2 border-gray-800 rounded-[28px] md:rounded-[32px] p-2 flex flex-col"
        >
          <template v-for="(type, i) in visibleNotificationTypes" :key="type">
            <div v-if="i > 0" class="h-px bg-white/5 mx-4" />
            <button
              type="button"
              class="w-full text-left p-4 flex items-center gap-4"
              :disabled="prefsStore.isLoading"
              @click="onToggle(type, !prefsStore.preferences.includes(type))"
            >
              <div
                class="w-12 h-12 md:w-[52px] md:h-[52px] rounded-[18px] bg-gray-900/60 flex items-center justify-center shrink-0"
                :class="ACCENT[NOTIF_META[type].accent].text"
              >
                <BaseIcon :name="NOTIF_META[type].icon" :size="24" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-[17px] md:text-[19px] text-gray-200">
                  {{ TYPE_LABELS[type] }}
                </div>
                <div class="text-[14px] md:text-[15px] text-gray-400 mt-0.5">
                  {{ NOTIF_META[type].desc }}
                </div>
              </div>
              <BaseToggle
                :model-value="prefsStore.preferences.includes(type)"
                :accent="NOTIF_META[type].accent"
                :disabled="prefsStore.isLoading"
                @update:model-value="(v) => onToggle(type, v)"
              />
            </button>
          </template>
        </div>
        <ErrorBanner
          v-if="prefsStore.error"
          :error="prefsStore.error"
          action="save your notification settings"
          class="mt-3"
        />
      </section>

      <section v-if="authStore.isAdmin">
        <div class="font-medium text-[18px] md:text-[20px] text-gray-400 mb-3">
          User management
        </div>
        <div
          class="bg-gray-800/50 border-2 border-gray-800 rounded-[28px] md:rounded-[32px] p-2 flex flex-col"
        >
          <p
            v-if="usersStore.isLoading && manageableUsers.length === 0"
            class="text-sm text-gray-400 p-4"
          >
            Loading users…
          </p>
          <p
            v-else-if="manageableUsers.length === 0"
            class="text-sm text-gray-400 p-4"
          >
            No other users in this home.
          </p>
          <template v-else>
            <template v-for="(user, i) in manageableUsers" :key="user.id">
              <div v-if="i > 0" class="h-px bg-white/5 mx-4" />
              <div class="w-full p-4 flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-full bg-gray-900 text-emerald-500 font-bold flex items-center justify-center shrink-0"
                >
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-[17px] text-gray-200 truncate">
                    {{ user.username }}
                  </div>
                  <div class="text-sm text-gray-400">
                    {{ ROLE_LABELS[user.role] }}
                  </div>
                </div>
                <select
                  :value="user.role"
                  :disabled="usersStore.isLoading"
                  class="rounded-2xl bg-gray-900/60 border-2 border-gray-800 px-3 py-2 text-sm text-gray-200 cursor-pointer focus:border-yellow-500 outline-none"
                  @change="onRoleChange(user.id, $event)"
                >
                  <option v-for="role in ALL_ROLES" :key="role" :value="role">
                    {{ ROLE_LABELS[role] }}
                  </option>
                </select>
              </div>
            </template>
          </template>
        </div>
        <ErrorBanner
          v-if="usersStore.error"
          :error="usersStore.error"
          action="update users"
          class="mt-3"
        />
      </section>

      <section>
        <button
          type="button"
          class="w-full h-16 rounded-[28px] md:rounded-[32px] border-2 border-rose-500/30 bg-rose-500/[0.08] text-rose-500 font-bold text-[17px] md:text-[19px] flex items-center justify-center gap-2.5 hover:bg-rose-500/[0.12] transition-colors"
          @click="confirmLogout = true"
        >
          <BaseIcon name="power" :size="22" />
          Log out
        </button>
        <div class="mt-3 text-[13px] text-gray-500 text-center">
          You'll need to enter your Home ID again next time.
        </div>
      </section>

      <div class="h-8" />
    </div>

    <div
      v-if="confirmLogout"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6"
      @click="confirmLogout = false"
    >
      <div
        class="bg-gray-800 rounded-[28px] md:rounded-[32px] p-6 md:p-8 w-full max-w-[460px] shadow-2xl"
        @click.stop
      >
        <div class="font-bold text-xl md:text-2xl text-gray-200 mb-2">
          Log out of HiHome?
        </div>
        <div class="text-[15px] md:text-base text-gray-400 mb-6">
          Active rules and connected devices will keep working in the
          background.
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 h-14 rounded-[24px] md:rounded-[28px] border-2 border-gray-800 text-gray-200 font-semibold text-[16px] md:text-[17px]"
            @click="confirmLogout = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 h-14 rounded-[24px] md:rounded-[28px] bg-rose-500 text-gray-900 font-bold text-[16px] md:text-[17px]"
            @click="
              confirmLogout = false;
              onLogout();
            "
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
