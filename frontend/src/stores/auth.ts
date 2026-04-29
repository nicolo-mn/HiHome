import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("jwt"));
  const username = ref<string | null>(null);
  const houseId = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(
    inputHouseId: string,
    inputUsername: string,
    inputPassword: string,
  ) {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        houseId: inputHouseId,
        username: inputUsername,
        password: inputPassword,
      }),
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    const data: { token: string } = await res.json();
    token.value = data.token;
    username.value = inputUsername;
    houseId.value = inputHouseId;
    localStorage.setItem("jwt", data.token);
  }

  function logout() {
    token.value = null;
    username.value = null;
    houseId.value = null;
    localStorage.removeItem("jwt");
  }

  return { token, username, houseId, isAuthenticated, login, logout };
});
