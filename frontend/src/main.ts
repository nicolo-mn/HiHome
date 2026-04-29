import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";

const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    if (input instanceof Request) {
      input.headers.set("Authorization", `Bearer ${token}`);
    } else {
      init = {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      };
    }
  }
  return originalFetch(input, init);
};

createApp(App).use(createPinia()).use(router).mount("#app");
