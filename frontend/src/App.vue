<script setup lang="ts">
import { ref } from "vue";

const username = ref("");
const houseId = ref("");
const statusMessage = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  statusMessage.value = "";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        houseId: houseId.value,
        username: username.value,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      statusMessage.value = "Login successful!";
      // TODO: save token and redirect to dashboard
    } else {
      statusMessage.value = `Error: ${data.message || "Invalid credentials"}`;
    }
  } catch (error) {
    statusMessage.value = `${error || "An unexpected error occurred"}.`;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-900 border-box text-white selection:bg-indigo-500 selection:text-white"
  >
    <div
      class="w-full max-w-md p-8 m-4 rounded-xl shadow-2xl bg-gray-800 border border-gray-700"
    >
      <div class="text-center mb-8">
        <h1
          class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500"
        >
          HiHome
        </h1>
        <p class="text-gray-400 mt-2 text-sm">Welcome back! Please sign in.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label
            for="houseId"
            class="block text-sm font-medium text-gray-300 mb-1"
            >House ID</label
          >
          <div class="relative">
            <input
              id="houseId"
              v-model="houseId"
              type="text"
              required
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400"
              placeholder="e.g. house1"
            />
          </div>
        </div>

        <div>
          <label
            for="username"
            class="block text-sm font-medium text-gray-300 mb-1"
            >Username</label
          >
          <div class="relative">
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400"
              placeholder="e.g. mockuser"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 px-4 flex justify-center rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            v-if="isLoading"
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isLoading ? "Signing in..." : "Sign in" }}
        </button>
      </form>

      <div
        v-if="statusMessage"
        class="mt-6 p-4 rounded-lg text-sm text-center font-medium"
        :class="
          statusMessage.includes('✅')
            ? 'bg-green-900/50 text-green-400 border border-green-800'
            : 'bg-red-900/50 text-red-400 border border-red-800'
        "
      >
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>
