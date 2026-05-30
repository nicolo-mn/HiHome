import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { registerApiHandlers } from "./api/setup";
import { useAuthStore } from "./stores/auth";
import { useSensorStore } from "./stores/sensors";
import { useDevicesStore } from "./stores/devices";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia).use(router);

const authStore = useAuthStore(pinia);
registerApiHandlers(authStore, router);

if (authStore.isAuthenticated) {
  useSensorStore(pinia).connect();
  useDevicesStore(pinia).connect();
}

app.mount("#app");
