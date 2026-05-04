import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { setUnauthorizedHandler } from "./api";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia).use(router);

const authStore = useAuthStore(pinia);

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

app.mount("#app");
