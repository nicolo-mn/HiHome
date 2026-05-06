import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "../api";

interface JwtPayload {
  username?: string;
  houseId?: string;
  exp?: number;
}

function decodeJwt(jwt: string | null): JwtPayload | null {
  if (!jwt) return null;
  try {
    const parsed = JSON.parse(atob(jwt.split(".")[1] ?? ""));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as JwtPayload)
      : null;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

export const useAuthStore = defineStore("auth", () => {
  const storedToken = localStorage.getItem("jwt");
  const validAtBoot = !!storedToken && !isExpired(decodeJwt(storedToken));

  if (storedToken && !validAtBoot) {
    localStorage.removeItem("jwt");
  }

  const token = ref<string | null>(validAtBoot ? storedToken : null);

  const payload = computed(() => decodeJwt(token.value));
  const username = computed(() => payload.value?.username ?? null);
  const houseId = computed(() => payload.value?.houseId ?? null);
  const expiresAt = computed(() =>
    payload.value?.exp ? payload.value.exp * 1000 : null,
  );

  const isAuthenticated = computed(() => {
    if (!token.value) return false;
    if (expiresAt.value && expiresAt.value <= Date.now()) return false;
    return true;
  });

  async function login(
    inputHouseId: string,
    inputUsername: string,
    inputPassword: string,
  ) {
    const { token: newToken } = await authApi.login({
      homeId: inputHouseId,
      username: inputUsername,
      password: inputPassword,
    });
    token.value = newToken;
    localStorage.setItem("jwt", newToken);
  }

  function logout() {
    token.value = null;
    localStorage.removeItem("jwt");
  }

  return {
    token,
    username,
    houseId,
    expiresAt,
    isAuthenticated,
    login,
    logout,
  };
});
