import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import LoginView from "./LoginView.vue";
import HomeView from "./HomeView.vue";
import { useAuthStore } from "../stores/auth";

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/login", name: "login", component: LoginView },
      { path: "/", name: "home", component: HomeView },
    ],
  });
}

describe("LoginView", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders house-id, username and password fields", () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(LoginView, {
      global: { plugins: [pinia, createTestRouter()] },
    });

    expect(wrapper.find('input[placeholder="house-id..."]').exists()).toBe(
      true,
    );
    expect(wrapper.find('input[placeholder="username..."]').exists()).toBe(
      true,
    );
    expect(wrapper.find('input[placeholder="password..."]').exists()).toBe(
      true,
    );
  });

  it("calls store login with entered values on submit", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(LoginView, {
      global: { plugins: [pinia, createTestRouter()] },
    });

    const store = useAuthStore();
    const loginSpy = vi.spyOn(store, "login").mockResolvedValue(undefined);

    await wrapper.find('input[placeholder="house-id..."]').setValue("house1");
    await wrapper.find('input[placeholder="username..."]').setValue("mockuser");
    await wrapper.find('input[placeholder="password..."]').setValue("pass123");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(loginSpy).toHaveBeenCalledWith("house1", "mockuser", "pass123");
  });

  it("shows error message when login fails", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(LoginView, {
      global: { plugins: [pinia, createTestRouter()] },
    });

    const store = useAuthStore();
    vi.spyOn(store, "login").mockRejectedValue(
      new Error("Invalid credentials"),
    );

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("Invalid credentials. Please try again.");
  });

  it("redirects to home after successful login", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createTestRouter();
    await router.push("/login");

    const wrapper = mount(LoginView, {
      global: { plugins: [pinia, router] },
    });

    const store = useAuthStore();
    vi.spyOn(store, "login").mockResolvedValue(undefined);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("home");
  });
});
