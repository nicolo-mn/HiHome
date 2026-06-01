import { describe, it, expect, vi } from "vitest";
import { Light, Room } from "../../domain";
import type { ChatCompletionPort } from "../ports/ChatCompletionPort";
import type { ChatStreamPort } from "../ports/ChatStreamPort";
import { ChatMessage, ChatService } from "./ChatService";
import { HomeService } from "./HomeService";

const streamPort = {} as ChatStreamPort;

const makeService = (
  homeOverrides: Partial<Pick<HomeService, "getDevices" | "getRooms">> = {},
) => {
  const completion: ChatCompletionPort = {
    streamChat: vi.fn().mockResolvedValue("assistant reply"),
  };
  const homeService = {
    getDevices: vi.fn().mockResolvedValue([]),
    getRooms: vi.fn().mockResolvedValue([]),
    ...homeOverrides,
  } as unknown as HomeService;
  const service = new ChatService(completion, homeService, {
    maxHistory: 2,
    model: "deepseek-chat",
  });
  return { service, completion, homeService };
};

const lastCallMessages = (completion: ChatCompletionPort): ChatMessage[] =>
  (completion.streamChat as ReturnType<typeof vi.fn>).mock.calls[0][0];

describe("ChatService.streamChat", () => {
  it("rejects a blank message", async () => {
    const { service } = makeService();
    await expect(
      service.streamChat("1", "alice", "   ", [], streamPort, false),
    ).rejects.toThrow("Message is required");
  });

  it("delegates to the completion port and returns its result", async () => {
    const { service, completion } = makeService();

    const result = await service.streamChat(
      "1",
      "alice",
      "hello",
      [],
      streamPort,
      true,
    );

    expect(result).toBe("assistant reply");
    expect(completion.streamChat).toHaveBeenCalledWith(
      expect.any(Array),
      "deepseek-chat",
      "1",
      streamPort,
      true,
    );
  });

  it("builds [system, ...history, user], drops system history and trims to maxHistory", async () => {
    const { service, completion } = makeService();
    const history: ChatMessage[] = [
      { role: "system", content: "SHOULD BE DROPPED" },
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
    ];

    await service.streamChat(
      "1",
      "alice",
      "current",
      history,
      streamPort,
      false,
    );

    const messages = lastCallMessages(completion);
    expect(messages[0].role).toBe("system");
    expect(messages.slice(1)).toEqual([
      { role: "assistant", content: "a1" }, // trimmed to last 2 of filtered
      { role: "user", content: "u2" },
      { role: "user", content: "current" },
    ]);
    expect(messages.some((m) => m.content === "SHOULD BE DROPPED")).toBe(false);
  });

  describe("system prompt", () => {
    it("summarizes devices with their room names", async () => {
      const { service, completion } = makeService({
        getDevices: vi
          .fn()
          .mockResolvedValue([new Light("light-1", "Main Light", "room-1")]),
        getRooms: vi
          .fn()
          .mockResolvedValue([new Room("room-1", "Living Room")]),
      });

      await service.streamChat("1", "alice", "hi", [], streamPort, false);

      const system = lastCallMessages(completion)[0].content;
      expect(system).toContain("Main Light");
      expect(system).toContain("Living Room");
    });

    it("reports 'none' when the home has no devices", async () => {
      const { service, completion } = makeService();

      await service.streamChat("1", "alice", "hi", [], streamPort, false);

      expect(lastCallMessages(completion)[0].content).toContain(
        "Home devices: none.",
      );
    });

    it("reports 'unavailable' when device lookup fails", async () => {
      const { service, completion } = makeService({
        getDevices: vi.fn().mockRejectedValue(new Error("db down")),
      });

      await service.streamChat("1", "alice", "hi", [], streamPort, false);

      expect(lastCallMessages(completion)[0].content).toContain(
        "Home devices: unavailable.",
      );
    });
  });
});
