<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAsyncAction } from "@/composables/useAsyncAction";
import BaseInput from "@/components/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const homeId = ref("");
const username = ref("");
const password = ref("");

const {
  run: submit,
  isLoading,
  error,
} = useAsyncAction(
  async () => {
    await authStore.login(homeId.value, username.value, password.value);
    const redirect = route.query.redirect;
    router.push(
      typeof redirect === "string" ? redirect : { name: "dashboard" },
    );
  },
  { onError: () => "Invalid credentials. Please try again." },
);

function handleLogin() {
  submit();
}
</script>

<template>
  <div class="min-h-screen bg-base flex flex-col">
    <div
      class="bg-surface border-b border-border text-primary px-4 py-2 text-sm font-semibold"
    >
      HiHome
    </div>

    <div class="flex-1 flex flex-col items-center justify-center px-8">
      <h1 class="text-5xl font-light text-primary mb-10">Login</h1>

      <form
        @submit.prevent="handleLogin"
        class="w-full max-w-xs flex flex-col gap-5"
      >
        <BaseInput label="Home ID" v-model="homeId" placeholder="home-id..." />
        <BaseInput
          label="Username"
          v-model="username"
          placeholder="username..."
        />
        <BaseInput
          label="Password"
          v-model="password"
          placeholder="password..."
          type="password"
        />

        <p v-if="error" class="text-danger text-sm text-center">{{ error }}</p>

        <div class="mt-20">
          <BaseButton type="submit" label="Confirm User" :loading="isLoading" />
        </div>
      </form>
    </div>
  </div>
</template>
