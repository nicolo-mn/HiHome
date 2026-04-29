<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import BaseInput from "../components/BaseInput.vue";
import BaseButton from "../components/BaseButton.vue";

const router = useRouter();
const authStore = useAuthStore();

const houseId = ref("");
const username = ref("");
const password = ref("");
const error = ref<string | null>(null);
const isLoading = ref(false);

async function handleLogin() {
  error.value = null;
  isLoading.value = true;
  try {
    await authStore.login(houseId.value, username.value, password.value);
    router.push({ name: "home" });
  } catch {
    error.value = "Invalid credentials. Please try again.";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-blue-100 flex flex-col">
    <div class="bg-gray-900 text-white px-4 py-2 text-sm">Login</div>

    <div class="flex-1 flex flex-col items-center justify-center px-8">
      <h1 class="text-5xl font-light text-blue-400 mb-10">Login</h1>

      <form
        @submit.prevent="handleLogin"
        class="w-full max-w-xs flex flex-col gap-5"
      >
        <BaseInput
          label="House- id"
          v-model="houseId"
          placeholder="house-id..."
        />
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

        <div class="flex justify-end">
          <a href="#" class="text-sm text-blue-400 hover:underline">sign-up</a>
        </div>

        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>

        <div class="mt-20">
          <BaseButton label="Confirm User" :loading="isLoading" />
        </div>
      </form>
    </div>
  </div>
</template>
