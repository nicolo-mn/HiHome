import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import AppLayout from "../components/AppLayout.vue";
import HomeView from "../views/HomeView.vue";
import DashboardView from "../views/DashboardView.vue";
import RulesView from "../views/RulesView.vue";

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
        { path: "", name: "home", component: HomeView },
        { path: "dashboard", name: "dashboard", component: DashboardView },
        { path: "rules", name: "rules", component: RulesView },
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
    return { name: "home" };
  }
});

export default router;
