<script setup lang="ts">
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
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
  </div>
</template>
