<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth-store";

const router = useRouter();
const authStore = useAuthStore();

const homeId = ref("");
const username = ref("");
const errorMsg = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  if (!homeId.value.trim() || !username.value.trim()) {
    errorMsg.value = "Please fill in both fields";
    return;
  }

  isLoading.value = true;
  errorMsg.value = "";

  try {
    await authStore.login(username.value.trim(), homeId.value.trim());
    router.push({ name: "dashboard" });
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : "Login failed. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <!-- Animated background orbs -->
    <div class="bg-orb bg-orb--1"></div>
    <div class="bg-orb bg-orb--2"></div>
    <div class="bg-orb bg-orb--3"></div>

    <div class="login-card">
      <div class="login-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M32 6L6 24V56H24V40H40V56H58V24L32 6Z"
            stroke="url(#homeGrad)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="32" cy="28" r="5" fill="url(#homeGrad)" opacity="0.8" />
          <defs>
            <linearGradient
              id="homeGrad"
              x1="6"
              y1="6"
              x2="58"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#00d2ff" />
              <stop offset="1" stop-color="#7b61ff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h1 class="login-title">HiHome</h1>
      <p class="login-subtitle">Smart Home Dashboard</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="login-home-id" class="input-label">Home ID</label>
          <input
            id="login-home-id"
            v-model="homeId"
            type="text"
            class="input-field"
            placeholder="e.g. home-1"
            autocomplete="off"
          />
        </div>

        <div class="input-group">
          <label for="login-username" class="input-label">Username</label>
          <input
            id="login-username"
            v-model="username"
            type="text"
            class="input-field"
            placeholder="e.g. alice"
            autocomplete="off"
          />
        </div>

        <div v-if="errorMsg" class="error-message">
          <svg viewBox="0 0 20 20" fill="currentColor" class="error-icon">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clip-rule="evenodd"
            />
          </svg>
          {{ errorMsg }}
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          class="login-btn"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="btn-spinner"></span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <p class="login-hint">
        Try: <strong>alice</strong> / <strong>home-1</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

/* Animated background orbs */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}

.bg-orb--1 {
  width: 400px;
  height: 400px;
  background: var(--accent-primary);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.bg-orb--2 {
  width: 350px;
  height: 350px;
  background: var(--accent-secondary);
  bottom: -80px;
  right: -80px;
  animation-delay: -7s;
}

.bg-orb--3 {
  width: 250px;
  height: 250px;
  background: var(--accent-tertiary);
  top: 50%;
  left: 60%;
  animation-delay: -14s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
}

.login-card {
  position: relative;
  z-index: 1;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 420px;
  margin: 1rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  animation: cardSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 210, 255, 0.7));
  }
}

.login-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin: 0.25rem 0 2rem;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}

.input-field {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  color: var(--text-primary);
  font-family: inherit;
  transition: all 0.25s ease;
  outline: none;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.input-field:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 82, 82, 0.12);
  border: 1px solid rgba(255, 82, 82, 0.3);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  color: var(--color-error);
  font-size: 0.9rem;
  animation: shakeError 0.4s ease;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@keyframes shakeError {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-6px);
  }
  75% {
    transform: translateX(6px);
  }
}

.login-btn {
  margin-top: 0.5rem;
  padding: 0.9rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: var(--gradient-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 210, 255, 0.35);
}

.login-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-hint {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.login-hint strong {
  color: var(--text-secondary);
}
</style>
