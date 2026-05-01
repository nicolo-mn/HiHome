import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import AppLayout from "../components/AppLayout.vue";
import DashboardView from "../views/DashboardView.vue";
import ComponentsView from "../views/ComponentsView.vue";
import RulesView from "../views/RulesView.vue";
import NotificationsView from "../views/NotificationsView.vue";
import SettingsView from "../views/SettingsView.vue";

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
        { path: "/", component: DashboardView },
        { path: "/dashboard", name: "dashboard", component: DashboardView },
        { path: "/components", name: "components", component: ComponentsView },
        { path: "/rules", name: "rules", component: RulesView },
        {
          path: "/notifications",
          name: "notifications",
          component: NotificationsView,
        },
        { path: "/settings", name: "settings", component: SettingsView },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const isAuthenticated = !!localStorage.getItem("jwt");

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "login" };
  }

  if (to.name === "login" && isAuthenticated) {
    return { name: "dashboard" };
  }
});

export default router;
