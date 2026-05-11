import type { Router } from "vue-router";
import { setAuthTokenProvider, setUnauthorizedHandler } from "./client";
import type { useAuthStore } from "../stores/auth";

export function registerApiHandlers(
  authStore: ReturnType<typeof useAuthStore>,
  router: Router,
) {
  setAuthTokenProvider(() => authStore.token);

  setUnauthorizedHandler(() => {
    if (!authStore.token) return;
    authStore.logout();
    const current = router.currentRoute.value;
    if (current.name === "login") return;
    router.push({
      name: "login",
      query: { redirect: current.fullPath },
    });
  });
}
