import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "./auth";

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

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorageMock());
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("isAuthenticated is false when no token", () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
  });

  it("isAuthenticated is true when token exists in localStorage", () => {
    localStorage.setItem("jwt", "existing-token");
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(true);
  });

  it("login saves token to state and localStorage on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: "jwt-token-123" }),
      }),
    );

    const store = useAuthStore();
    await store.login("house1", "mockuser", "password");

    expect(store.token).toBe("jwt-token-123");
    expect(store.username).toBe("mockuser");
    expect(store.houseId).toBe("house1");
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem("jwt")).toBe("jwt-token-123");
  });

  it("login throws on failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const store = useAuthStore();
    await expect(store.login("house1", "wrong", "wrong")).rejects.toThrow(
      "Invalid credentials",
    );
    expect(store.isAuthenticated).toBe(false);
  });

  it("logout clears state and localStorage", () => {
    localStorage.setItem("jwt", "some-token");
    const store = useAuthStore();
    store.token = "some-token";
    store.username = "mockuser";
    store.houseId = "house1";

    store.logout();

    expect(store.token).toBeNull();
    expect(store.username).toBeNull();
    expect(store.houseId).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem("jwt")).toBeNull();
  });
});
