<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import bellIcon from "@/assets/icons/bell.svg?raw";
import settingsIcon from "@/assets/icons/settings.svg?raw";

const authStore = useAuthStore();
</script>

<template>
  <header
    class="bg-surface border-b border-border px-6 py-3 flex items-center justify-between"
  >
    <RouterLink
      to="/dashboard"
      class="font-semibold text-primary text-lg hover:opacity-90 transition"
    >
      HiHome
    </RouterLink>

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

      <span class="px-2 py-1 text-primary text-sm">
        {{ authStore.username ?? "User" }}
      </span>
    </div>
  </header>
</template>
