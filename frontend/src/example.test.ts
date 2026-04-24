import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import App from "./App.vue";

describe("App Component", () => {
  it("should render without errors", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: { template: "<div>Router View Stub</div>" },
        },
      },
    });

    expect(wrapper.text()).toContain("Router View Stub");
  });
});
