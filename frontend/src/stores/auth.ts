import { defineStore } from "pinia";
import { ref, computed } from "vue";

function decodeJwt(jwt: string | null): Record<string, string> | null {
  if (!jwt) return null;
  try {
    return JSON.parse(atob(jwt.split(".")[1] ?? ""));
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const storedToken = localStorage.getItem("jwt");
  const decoded = decodeJwt(storedToken);

  const token = ref<string | null>(storedToken);
  const username = ref<string | null>(decoded?.username ?? null);
  const houseId = ref<string | null>(decoded?.houseId ?? null);

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
