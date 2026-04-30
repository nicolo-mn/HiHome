<script setup lang="ts">
import homeIcon from "../assets/icons/house.svg?raw";
import dashboardIcon from "../assets/icons/dashboard.svg?raw";
import rulesIcon from "../assets/icons/rules.svg?raw";

const navItems = [
  { name: "Home", to: "/", icon: homeIcon, exact: true },
  { name: "Dashboard", to: "/dashboard", icon: dashboardIcon, exact: false },
  { name: "Rules", to: "/rules", icon: rulesIcon, exact: false },
];
</script>

<template>
  <nav
    class="w-16 bg-white border-r border-blue-100 flex flex-col items-center py-6 gap-6"
  >
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      :title="item.name"
      class="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition"
      active-class=""
      exact-active-class="text-blue-500 bg-blue-50"
    >
      <span class="w-6 h-6 block" v-html="item.icon" />
    </RouterLink>
  </nav>
</template>
