<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useNotificationSocket } from "@/composables/useNotificationSocket";
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
import NotificationBanner from "./NotificationBanner.vue";

const authStore = useAuthStore();
const { token } = storeToRefs(authStore);
const homeId = computed(() => authStore.homeId);

const { toasts, dismiss } = useNotificationSocket(homeId, token);
</script>

<template>
  <div class="min-h-screen bg-base flex flex-col md:flex-row">
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
        <RouterView />
      </main>
    </div>
    <NotificationBanner :toasts="toasts" @dismiss="dismiss" />
  </div>
</template>
