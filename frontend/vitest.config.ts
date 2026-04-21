import { defineConfig, mergeConfig } from "vitest/config";
import rootConfig from "../vitest.config";
import vue from "@vitejs/plugin-vue";

export default mergeConfig(
  rootConfig,
  defineConfig({
    plugins: [vue()],
    test: {
      environment: "jsdom", // Vue components need a DOM
    },
  }),
);
