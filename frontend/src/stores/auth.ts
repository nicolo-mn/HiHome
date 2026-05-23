import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "@/api";
import { decodeJwt, isExpired } from "@/utils/jwt";
import { useSensorStore } from "@/stores/sensors";
import { useComponentsStore } from "@/stores/components";

export const useAuthStore = defineStore("auth", () => {
  const storedToken = localStorage.getItem("jwt");
  const validAtBoot = !!storedToken && !isExpired(decodeJwt(storedToken));

  if (storedToken && !validAtBoot) {
    localStorage.removeItem("jwt");
  }

  const token = ref<string | null>(validAtBoot ? storedToken : null);

  const payload = computed(() => decodeJwt(token.value));
  const username = computed(() => payload.value?.username ?? null);
  const homeId = computed(() => payload.value?.homeId ?? null);
  const role = computed(() => payload.value?.role ?? null);
  const isAdmin = computed(() => role.value === "Admin");
  const expiresAt = computed(() =>
    payload.value?.exp ? payload.value.exp * 1000 : null,
  );

  const isAuthenticated = computed(() => {
    if (!token.value) return false;
    if (expiresAt.value && expiresAt.value <= Date.now()) return false;
    return true;
  });

  async function login(
    inputHomeId: string,
    inputUsername: string,
    inputPassword: string,
  ) {
    const { token: newToken } = await authApi.login({
      homeId: inputHomeId,
      username: inputUsername,
      password: inputPassword,
    });
    token.value = newToken;
    localStorage.setItem("jwt", newToken);
    useSensorStore().connect();
    useComponentsStore().connect();
  }

  function logout() {
    token.value = null;
    localStorage.removeItem("jwt");
    useSensorStore().disconnect();
    useComponentsStore().disconnect();
  }

  return {
    token,
    username,
    homeId,
    role,
    isAdmin,
    expiresAt,
    isAuthenticated,
    login,
    logout,
  };
});
