<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useNotificationSocket } from "@/composables/useNotificationSocket";
import AppSidebar from "./AppSidebar.vue";
import AppBottomNav from "./AppBottomNav.vue";
import NotificationBanner from "./NotificationBanner.vue";

const authStore = useAuthStore();
const { token } = storeToRefs(authStore);
const homeId = computed(() => authStore.homeId);

const { toasts, dismiss } = useNotificationSocket(homeId, token);
</script>

<template>
  <div
    class="min-h-screen flex bg-gray-900 text-gray-200 font-sans antialiased"
  >
    <AppSidebar />

    <main class="flex-1 min-w-0 flex flex-col">
      <div class="flex-1 min-h-screen pb-32 md:pb-0">
        <div
          class="mx-auto w-full max-w-[1280px] px-5 sm:px-8 md:px-10 lg:px-12 pt-6 md:pt-10"
        >
          <RouterView />
        </div>
      </div>
    </main>

    <AppBottomNav />
    <NotificationBanner :toasts="toasts" @dismiss="dismiss" />
  </div>
</template>
