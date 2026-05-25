<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import BaseIcon from "./BaseIcon.vue";
import type { IconName } from "@/types/ui";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  admin?: boolean;
}

const auth = useAuthStore();
const router = useRouter();

const primary: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/components", label: "Components", icon: "devices" },
  { to: "/chat", label: "Assistant", icon: "assistant" },
  { to: "/rules", label: "Rules", icon: "rules", admin: true },
];

const secondary: NavItem[] = [
  { to: "/notifications", label: "Activity", icon: "bell" },
  { to: "/usage-insights", label: "Insights", icon: "chart" },
  { to: "/thermostat-plan", label: "Plan", icon: "device_thermostat" },
  { to: "/event-log", label: "Event log", icon: "log", admin: true },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const visiblePrimary = computed(() =>
  primary.filter((i) => !i.admin || auth.isAdmin),
);
const visibleSecondary = computed(() =>
  secondary.filter((i) => !i.admin || auth.isAdmin),
);

const initial = computed(() => (auth.username ?? "U").charAt(0).toUpperCase());

function isActive(to: string) {
  return router.currentRoute.value.path === to;
}
</script>

<template>
  <aside
    class="hidden md:flex md:flex-col w-[80px] lg:w-[248px] shrink-0 h-screen sticky top-0 bg-gray-900 border-r border-white/[0.06] px-3 lg:px-4 py-5 gap-1 z-20"
  >
    <RouterLink
      to="/dashboard"
      class="flex items-center gap-3 px-2 mb-6 no-underline"
    >
      <div
        class="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-700/40 flex items-center justify-center shrink-0"
      >
        <BaseIcon name="home" :size="22" class="text-yellow-500" />
        <span
          class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gray-900 border-[2px] border-sky-500"
        />
      </div>
      <span
        class="hidden lg:inline font-bold text-[18px] text-gray-200 tracking-tight"
      >
        HiHome
      </span>
    </RouterLink>

    <nav class="flex flex-col gap-1">
      <RouterLink
        v-for="t in visiblePrimary"
        :key="t.to"
        :to="t.to"
        :class="[
          'h-12 rounded-2xl flex items-center gap-3 px-3 transition-colors no-underline',
          'lg:justify-start justify-center',
          isActive(t.to)
            ? 'bg-gray-800 text-gray-100'
            : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200',
        ]"
      >
        <BaseIcon :name="t.icon" :size="22" />
        <span class="hidden lg:inline font-medium text-[15px]">
          {{ t.label }}
        </span>
      </RouterLink>
    </nav>

    <div class="h-px bg-white/5 mx-2 my-3" />

    <nav class="flex flex-col gap-1">
      <RouterLink
        v-for="t in visibleSecondary"
        :key="t.to"
        :to="t.to"
        :class="[
          'h-11 rounded-2xl flex items-center gap-3 px-3 transition-colors no-underline',
          'lg:justify-start justify-center',
          isActive(t.to)
            ? 'bg-gray-800 text-gray-100'
            : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200',
        ]"
      >
        <BaseIcon :name="t.icon" :size="20" />
        <span class="hidden lg:inline text-[14px]">{{ t.label }}</span>
      </RouterLink>
    </nav>

    <RouterLink
      to="/settings"
      class="mt-auto w-full rounded-2xl flex items-center gap-3 p-2 lg:px-2.5 lg:py-2 hover:bg-white/[0.04] text-left no-underline"
    >
      <div
        class="w-9 h-9 rounded-full bg-yellow-500/15 text-yellow-500 font-bold text-base flex items-center justify-center shrink-0"
      >
        {{ initial }}
      </div>
      <div class="hidden lg:flex flex-col min-w-0">
        <span class="text-sm font-semibold text-gray-200 truncate">
          {{ auth.username ?? "User" }}
        </span>
        <span class="text-xs text-gray-500 truncate">
          {{ auth.homeId ?? "" }}
        </span>
      </div>
    </RouterLink>
  </aside>
</template>
