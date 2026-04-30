<script setup lang="ts">
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
</script>

<template>
  <div class="min-h-screen bg-blue-50 flex flex-col">
    <AppHeader />
    <div class="flex flex-1">
      <AppSidebar />
      <main class="flex-1 p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
