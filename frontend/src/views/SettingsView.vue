<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

function onLogout() {
  authStore.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-primary">Settings</h1>

    <section class="rounded-2xl border border-border bg-surface p-4">
      <h2 class="text-base font-semibold text-primary">Account</h2>
      <p class="text-sm text-muted">
        Signed in as {{ authStore.username ?? "User" }}
      </p>

      <button
        type="button"
        class="mt-4 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-elevated transition"
        @click="onLogout"
      >
        Logout
      </button>
    </section>
  </div>
</template>
