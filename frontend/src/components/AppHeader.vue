<script setup lang="ts">
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
</script>

<template>
  <header
    class="bg-white border-b border-blue-100 px-6 py-3 flex items-center justify-between"
  >
    <span class="font-semibold text-gray-800 text-lg">HiHome</span>
    <span class="text-gray-500 text-sm">{{
      authStore.username ?? "User"
    }}</span>
  </header>
</template>
