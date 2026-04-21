<script setup lang="ts">
import { ref } from "vue";

const backendMessage = ref<string>(
  "Click the button to fetch data from the backend!",
);
const isLoading = ref<boolean>(false);

const handleFetch = async () => {
  isLoading.value = true;
  try {
    // The request goes to exactly '/api/message'
    // Vite intercepts this and forwards it to http://localhost:3000/api/message
    // (thanks to the proxy configured in vite.config.ts)
    const res = await fetch("/api/message");
    const data = await res.json();
    backendMessage.value = data.text;
  } catch {
    backendMessage.value = "Error connecting to backend API.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container">
    <div class="logos">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </div>

    <h1>MEVN Template</h1>

    <div class="card">
      <button @click="handleFetch" :disabled="isLoading">
        {{ isLoading ? "Loading..." : "Fetch from Backend" }}
      </button>

      <p class="message-box">
        Server Response: <strong>{{ backendMessage }}</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.container {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}
.logos {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}
.logo {
  height: 6em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
.card {
  padding: 2em;
  background-color: #1a1a1a;
  border-radius: 8px;
  margin-top: 2rem;
}
button {
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #646cff;
  color: white;
  cursor: pointer;
  transition:
    border-color 0.25s,
    background-color 0.25s;
}
button:hover {
  background-color: #535bf2;
}
button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
.message-box {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border-left: 4px solid #42b883;
  text-align: left;
}
</style>
