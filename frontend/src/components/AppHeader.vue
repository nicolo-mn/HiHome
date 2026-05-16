<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import bellIcon from "@/assets/icons/bell.svg?raw";
import settingsIcon from "@/assets/icons/settings.svg?raw";

const authStore = useAuthStore();
const router = useRouter();

function onLogout() {
  authStore.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <header
    class="bg-surface border-b border-border px-6 py-3 flex items-center justify-between"
  >
    <span class="font-semibold text-primary text-lg">HiHome</span>

    <div class="flex items-center gap-3">
      <RouterLink
        to="/notifications"
        title="Notifications"
        class="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-elevated transition"
        exact-active-class="text-primary"
      >
        <span class="w-5 h-5 block" v-html="bellIcon" />
      </RouterLink>

      <RouterLink
        to="/settings"
        title="Settings"
        class="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-elevated transition"
        exact-active-class="text-primary"
      >
        <span class="w-5 h-5 block" v-html="settingsIcon" />
      </RouterLink>

      <button
        type="button"
        title="Logout"
        class="px-2 py-1 rounded-lg text-primary text-sm hover:bg-elevated transition"
        @click="onLogout"
      >
        {{ authStore.username ?? "User" }}
      </button>
    </div>
  </header>
</template>
