<script setup lang="ts">
import componentsIcon from "@/assets/icons/components.svg?raw";
import dashboardIcon from "@/assets/icons/dashboard.svg?raw";
import rulesIcon from "@/assets/icons/rules.svg?raw";

const navItems = [
  { name: "Dashboard", to: "/dashboard", icon: dashboardIcon },
  { name: "Components", to: "/components", icon: componentsIcon },
  { name: "Rules", to: "/rules", icon: rulesIcon },
];
</script>

<template>
  <!-- Desktop: sidebar sx -->
  <nav
    class="hidden md:flex flex-col w-16 bg-surface border-r border-border items-center justify-center gap-6 min-h-screen"
  >
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="relative group p-2 rounded-xl text-muted hover:text-primary hover:bg-elevated transition"
      active-class=""
      exact-active-class="text-primary bg-elevated"
    >
      <span class="w-6 h-6 block" v-html="item.icon" />
      <span
        class="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated text-primary text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none"
      >
        {{ item.name }}
      </span>
    </RouterLink>
  </nav>

  <!-- Mobile: bottom bar -->
  <nav
    class="fixed bottom-0 left-0 right-0 md:hidden bg-surface border-t border-border flex justify-around py-3 z-50"
  >
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      :title="item.name"
      class="p-2 rounded-xl text-muted hover:text-primary transition"
      active-class=""
      exact-active-class="text-primary"
    >
      <span class="w-6 h-6 block" v-html="item.icon" />
    </RouterLink>
  </nav>
</template>
