import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("hihome_token"));
  const username = ref<string | null>(localStorage.getItem("hihome_username"));
  const homeId = ref<string | null>(localStorage.getItem("hihome_homeId"));

  const isAuthenticated = computed(() => !!token.value);

  async function login(
    loginUsername: string,
    loginHomeId: string,
  ): Promise<void> {
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: loginUsername, homeId: loginHomeId }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }

    const data = await res.json();
    token.value = data.token;
    username.value = loginUsername;
    homeId.value = loginHomeId;

    localStorage.setItem("hihome_token", data.token);
    localStorage.setItem("hihome_username", loginUsername);
    localStorage.setItem("hihome_homeId", loginHomeId);
  }

  function logout(): void {
    token.value = null;
    username.value = null;
    homeId.value = null;
    localStorage.removeItem("hihome_token");
    localStorage.removeItem("hihome_username");
    localStorage.removeItem("hihome_homeId");
  }

  return { token, username, homeId, isAuthenticated, login, logout };
});
