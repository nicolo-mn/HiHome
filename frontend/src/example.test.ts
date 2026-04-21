import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HelloWorld from "./components/HelloWorld.vue";

describe("Frontend HelloWorld Test", () => {
  it("should render the actual component and test interaction", async () => {
    // Mount the real source file instead of a dummy component
    const wrapper = mount(HelloWorld, {
      props: { msg: "Testing Real Component" },
    });

    expect(wrapper.text()).toContain("Testing Real Component");

    // Test that the button increments the count (covers the method)
    const button = wrapper.find("button");
    expect(button.text()).toContain("count is 0");
    await button.trigger("click");
    expect(button.text()).toContain("count is 1");
  });
});
