<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import BaseIcon from "./BaseIcon.vue";
import BaseBottomSheet from "./BaseBottomSheet.vue";
import type { IconName } from "@/types/ui";

interface Tab {
  to: string;
  label: string;
  icon: IconName;
  admin?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  admin?: boolean;
}

const auth = useAuthStore();
const router = useRouter();

const tabs: Tab[] = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/components", label: "Devices", icon: "devices" },
  { to: "/chat", label: "Assistant", icon: "assistant" },
];

const menuItems: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/components", label: "Devices", icon: "devices" },
  { to: "/chat", label: "Assistant", icon: "assistant" },
  { to: "/rules", label: "Rules", icon: "rules", admin: true },
  { to: "/notifications", label: "Activity", icon: "bell" },
  { to: "/usage-insights", label: "Insights", icon: "chart" },
  { to: "/thermostat-plan", label: "Daily plan", icon: "device_thermostat" },
  { to: "/event-log", label: "Event log", icon: "log", admin: true },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const visibleTabs = computed(() =>
  tabs.filter((t) => !t.admin || auth.isAdmin),
);
const visibleMenuItems = computed(() =>
  menuItems.filter((i) => !i.admin || auth.isAdmin),
);

const isMenuOpen = ref(false);

function isActive(to: string) {
  return router.currentRoute.value.path === to;
}

function openMenu() {
  isMenuOpen.value = true;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function goTo(to: string) {
  isMenuOpen.value = false;
  if (router.currentRoute.value.path !== to) {
    router.push(to);
  }
}
</script>

<template>
  <div class="md:hidden fixed inset-x-0 bottom-0 z-30 pointer-events-none">
    <div
      class="h-24 bg-gradient-to-b from-transparent to-gray-900 pointer-events-none"
    />
    <div class="bg-gray-900 px-4 pb-4 pt-1 pointer-events-auto">
      <div
        class="h-[80px] rounded-full bg-gray-800 flex flex-row justify-between items-center gap-1 px-2.5"
        style="box-shadow: 0 6px 12px 12px rgba(0, 0, 0, 0.08)"
      >
        <RouterLink
          v-for="t in visibleTabs"
          :key="t.to"
          :to="t.to"
          :class="[
            'flex-1 h-[60px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors no-underline',
            isActive(t.to)
              ? 'bg-gray-700 text-gray-100'
              : 'bg-transparent text-gray-300 hover:bg-gray-700/40',
          ]"
        >
          <BaseIcon :name="t.icon" :size="24" />
          <span class="text-[11px] font-medium leading-3">{{ t.label }}</span>
        </RouterLink>
        <button
          type="button"
          :class="[
            'flex-1 h-[60px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors',
            isMenuOpen
              ? 'bg-gray-700 text-gray-100'
              : 'bg-transparent text-gray-300 hover:bg-gray-700/40',
          ]"
          @click="openMenu"
        >
          <BaseIcon name="more" :size="24" />
          <span class="text-[11px] font-medium leading-3">Menu</span>
        </button>
      </div>
    </div>
  </div>

  <BaseBottomSheet v-if="isMenuOpen" @close="closeMenu">
    <div class="font-bold text-2xl mb-3 text-gray-200">Navigate</div>
    <div class="flex flex-col gap-1.5 overflow-y-auto" style="max-height: 60vh">
      <button
        v-for="item in visibleMenuItems"
        :key="item.to"
        type="button"
        :class="[
          'flex items-center gap-3.5 p-3.5 rounded-[18px] text-left transition-colors',
          isActive(item.to) ? 'bg-white/5' : 'hover:bg-white/[0.02]',
        ]"
        @click="goTo(item.to)"
      >
        <div
          class="w-11 h-11 rounded-2xl bg-gray-900/60 flex items-center justify-center text-gray-200"
        >
          <BaseIcon :name="item.icon" :size="22" />
        </div>
        <div class="flex-1">
          <div class="text-[18px] font-semibold text-gray-200">
            {{ item.label }}
          </div>
        </div>
        <BaseIcon
          :name="isActive(item.to) ? 'check' : 'chevron_right'"
          :size="22"
          class="text-gray-500"
        />
      </button>
    </div>
  </BaseBottomSheet>
</template>
