import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { registerApiHandlers } from "./api/setup";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia).use(router);

registerApiHandlers(useAuthStore(pinia), router);

app.mount("#app");
