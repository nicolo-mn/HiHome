import { describe, it, expect, vi } from "vitest";

// Mock express to prevent starting a real server
vi.mock("express", () => {
  const appMock = {
    get: vi.fn(),
    use: vi.fn(),
    listen: vi.fn(),
  };
  const expressMock = Object.assign(
    vi.fn(() => appMock),
    {
      json: vi.fn(),
    },
  );
  return { default: expressMock };
});

// Mock mongoose to prevent actual DB connection
vi.mock("mongoose", () => {
  return {
    default: {
      connect: vi.fn().mockResolvedValue(true),
      connection: { readyState: 1 },
    },
  };
});

describe("Backend Index Scope", () => {
  it("should process the index file and register dependencies", async () => {
    // Import the source file to trigger execution and generate coverage
    await import("./index");

    const mongoose = (await import("mongoose")).default;

    // Expect the file to have called mongoose.connect
    expect(mongoose.connect).toHaveBeenCalled();
  });
});
