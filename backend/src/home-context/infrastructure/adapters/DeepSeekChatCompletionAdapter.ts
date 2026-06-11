import type { ChatCompletionPort } from "../../application/ports/ChatCompletionPort";
import type { ChatMessage } from "../../application/services/ChatService";
import type { ChatStreamPort } from "../../application/ports/ChatStreamPort";
import { ChatStreamEventType } from "../../application/ports/ChatStreamPort";
import type { ForecastPort } from "../../application/ports/ForecastPort";
import { HomeService } from "../../application/services/HomeService";
import { RuleService } from "../../../rule-context/application/services/RuleService";
import { buildTools } from "./DeepSeekToolDefinitions";
import type {
  DeepSeekTool,
  DeepSeekToolCall,
  DeepSeekMessage,
} from "./DeepSeekToolDefinitions";
import { DeepSeekToolHandler } from "./DeepSeekToolHandler";

type DeepSeekOptions = {
  apiKey: string;
  apiBaseUrl: string;
};

// Parses payload obtained from DeepSeek APIs
type DeepSeekResponseDTO = {
  content?: string | null;
  reasoning_content?: string | null;
  tool_calls?: DeepSeekToolCall[];
};

// reply update sent incrementally when using streaming
type StreamChunk = {
  content?: string | null;
  reasoning_content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: "function";
    function?: { name?: string; arguments?: string };
  }>;
};

export class DeepSeekChatCompletionAdapter implements ChatCompletionPort {
  private toolHandler: DeepSeekToolHandler;

  constructor(
    private options: DeepSeekOptions,
    private forecastPort: ForecastPort,
    private homeService: HomeService,
    private ruleService: RuleService,
  ) {
    this.toolHandler = new DeepSeekToolHandler(
      forecastPort,
      homeService,
      ruleService,
    );
  }

  async streamChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
    streamPort: ChatStreamPort,
    isAdmin: boolean,
  ): Promise<string> {
    if (!this.options.apiKey) {
      throw new Error("DeepSeek API key is missing");
    }

    const tools = buildTools(isAdmin);
    let chatMessages: DeepSeekMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reply = await this.requestStreamChat(
        model,
        chatMessages,
        tools,
        streamPort,
      );
      const toolCalls = reply.tool_calls ?? [];

      if (toolCalls.length === 0) {
        const content = reply.content?.trim();
        if (!content) {
          throw new Error("DeepSeek returned an empty response");
        }
        return content;
      }

      // Notify frontend about each tool being called
      for (const tc of toolCalls) {
        streamPort.emit({
          type: ChatStreamEventType.ToolCall,
          name: tc.function.name,
        });
      }

      const toolResponses = await this.toolHandler.handleToolCalls(
        toolCalls,
        homeId,
      );
      chatMessages = [
        ...chatMessages,
        {
          role: "assistant",
          content: reply.content ?? null,
          reasoning_content: reply.reasoning_content ?? null,
          tool_calls: toolCalls,
        },
        ...toolResponses,
      ];
    }

    throw new Error("DeepSeek did not return a final response");
  }

  // Format sent by DeepSeek:
  // text update: {"choices":[{"delta":{"content":"Hello"}}]}
  // reasonig update (currently unused): {"choices":[{"delta":{"content":"Hello"}}]}
  // tool update: {"choices":[{"delta":{"tool_calls":[...]}}]}
  // end update: [DONE]
  private async requestStreamChat(
    model: string,
    messages: DeepSeekMessage[],
    tools: DeepSeekTool[],
    streamPort: ChatStreamPort,
  ): Promise<DeepSeekResponseDTO> {
    const url = new URL("/chat/completions", this.options.apiBaseUrl);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `DeepSeekChatCompletionAdapter: DeepSeek API error during requestStreamChat: ${response.status} ${errorText}`,
      );
      throw new Error(`DeepSeek error: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error("DeepSeek returned no stream body");
    }

    let contentParts: string[] = [];
    let reasoningParts: string[] = [];
    const toolCallAccumulators: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        const chunk = this.parseStreamChunk(data);
        if (!chunk) {
          continue;
        }

        const delta = chunk;

        if (delta.content) {
          contentParts.push(delta.content);
          streamPort.emit({
            type: ChatStreamEventType.Token,
            content: delta.content,
          });
        }

        if (delta.reasoning_content) {
          reasoningParts.push(delta.reasoning_content);
        }

        // tool calls, as other tokens, arrive fragmented, so they need to be accumulated
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCallAccumulators.has(tc.index)) {
              toolCallAccumulators.set(tc.index, {
                id: tc.id ?? "",
                name: tc.function?.name ?? "",
                arguments: "",
              });
            }
            const acc = toolCallAccumulators.get(tc.index)!;
            if (tc.id) acc.id = tc.id;
            if (tc.function?.name) acc.name = tc.function.name;
            if (tc.function?.arguments) {
              acc.arguments += tc.function.arguments;
            }
          }
        }
      }
    }

    const toolCalls: DeepSeekToolCall[] = [];
    for (const [, acc] of toolCallAccumulators) {
      toolCalls.push({
        id: acc.id,
        type: "function",
        function: { name: acc.name, arguments: acc.arguments },
      });
    }

    const content = contentParts.join("") || null;
    const reasoningContent = reasoningParts.join("") || null;

    return {
      content,
      reasoning_content: reasoningContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  private parseStreamChunk(data: string): StreamChunk | null {
    try {
      const raw = JSON.parse(data) as {
        delta?: StreamChunk;
        choices?: Array<{ delta?: StreamChunk }>;
      };
      return raw.delta ?? raw.choices?.[0]?.delta ?? null;
    } catch {
      return null;
    }
  }
}
