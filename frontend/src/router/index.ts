import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import AppLayout from "@/components/AppLayout.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "/", redirect: { name: "dashboard" } },
        {
          path: "/dashboard",
          name: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
        },
        {
          path: "/components",
          name: "components",
          component: () => import("@/views/ComponentsView.vue"),
        },
        {
          path: "/rules",
          name: "rules",
          component: () => import("@/views/RulesView.vue"),
        },
        {
          path: "/rules/create",
          name: "rule-create",
          component: () => import("@/views/RuleCreateView.vue"),
        },
        {
          path: "/notifications",
          name: "notifications",
          component: () => import("@/views/NotificationsView.vue"),
        },
        {
          path: "/settings",
          name: "settings",
          component: () => import("@/views/SettingsView.vue"),
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    if (auth.token) auth.logout();
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.name === "login" && auth.isAuthenticated) {
    return { name: "dashboard" };
  }
});

export default router;
