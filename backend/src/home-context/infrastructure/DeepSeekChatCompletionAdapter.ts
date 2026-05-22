import type { ChatCompletionPort } from "../application/ChatCompletionPort";
import type { ChatMessage } from "../application/ChatService";
import type { ChatStreamPort } from "../application/ChatStreamPort";
import { ChatStreamEventType } from "../application/ChatStreamPort";
import type {
  ForecastPort,
  ForecastSummary,
} from "../application/ForecastPort";
import { HomeService } from "../application/HomeService";
import type { AddRuleDto } from "../../rule-context/application/RuleService";
import { RuleService } from "../../rule-context/application/RuleService";
type DeepSeekOptions = {
  apiKey: string;
  apiBaseUrl: string;
};

// DTO to be sent to the model when invoking it, to let it know about the possible tools
type DeepSeekTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

// Represents a tool invocation request by the model
type DeepSeekToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

// DTO used for requests to DeepSeek APIs
// if role is "tool", content contains the tool response and tool_call_id identifies which tool call this is responding to
// if role is "assistant", content contains the model reply and reasoning_content contains the model reasoning trace
type DeepSeekMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  reasoning_content?: string | null;
  tool_call_id?: string;
  tool_calls?: DeepSeekToolCall[];
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
  constructor(
    private options: DeepSeekOptions,
    private forecastPort: ForecastPort,
    private homeService: HomeService,
    private ruleService: RuleService,
  ) {}

  async completeChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
  ): Promise<string> {
    if (!this.options.apiKey) {
      throw new Error("DeepSeek API key is missing");
    }

    const tools = [this.buildForecastTool(), this.buildAddRuleTool()];
    let chatMessages: DeepSeekMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const reply = await this.requestChat(model, chatMessages, tools);
      const toolCalls = reply.tool_calls ?? [];

      if (toolCalls.length === 0) {
        const content = reply.content?.trim();
        if (!content) {
          throw new Error("DeepSeek returned an empty response");
        }
        return content;
      }

      const toolResponses = await this.handleToolCalls(toolCalls, homeId);
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

  async streamChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
    streamPort: ChatStreamPort,
  ): Promise<string> {
    if (!this.options.apiKey) {
      throw new Error("DeepSeek API key is missing");
    }

    const tools = [this.buildForecastTool(), this.buildAddRuleTool()];
    let chatMessages: DeepSeekMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    for (let attempt = 0; attempt < 2; attempt += 1) {
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

      const toolResponses = await this.handleToolCalls(toolCalls, homeId);
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

  private buildForecastTool(): DeepSeekTool {
    return {
      type: "function",
      function: {
        name: "get_forecast_summary",
        description: "Get a concise forecast summary for the current home.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    };
  }

  private buildAddRuleTool(): DeepSeekTool {
    return {
      type: "function",
      function: {
        name: "add_rule",
        description:
          "Create an automation rule for the current home. Use this tool only after collecting all required fields. " +
          "Fields: ruleName (short label), observableId (weather|external-thermometer|internal-thermometer|wind-speed|air-quality). " +
          "For weather: operatorTarget must be one of Clear, Drizzle, Fog, Overcast, Cloudy, Rain, Snow, Thunderstorm and operator is omitted. " +
          "For numeric observables: operator is gt|lt|eq and operatorTarget is a number or numeric string. " +
          "Actions is a non-empty array; each action has componentType (light|window|thermostat), command, componentId, and targetTemp required only when command is setTemperature. Commands by type: light -> turnOn|turnOff, window -> open|close, thermostat -> setTemperature.",
        parameters: {
          type: "object",
          properties: {
            ruleName: {
              type: "string",
              description: "Human-friendly rule label.",
            },
            observableId: {
              type: "string",
              enum: [
                "weather",
                "external-thermometer",
                "internal-thermometer",
                "wind-speed",
                "air-quality",
              ],
            },
            operator: {
              type: "string",
              enum: ["gt", "lt", "eq"],
              description:
                "Required for numeric observables; omit for weather.",
            },
            operatorTarget: {
              type: ["string", "number"],
              description: "Weather forecast string or numeric boundary value.",
            },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  componentType: {
                    type: "string",
                    enum: ["light", "window", "thermostat"],
                  },
                  command: {
                    type: "string",
                    enum: [
                      "turnOn",
                      "turnOff",
                      "open",
                      "close",
                      "setTemperature",
                    ],
                  },
                  componentId: { type: ["string", "number"] },
                  targetTemp: { type: ["string", "number"] },
                },
                required: ["componentType", "command", "componentId"],
              },
            },
          },
          required: ["ruleName", "observableId", "operatorTarget", "actions"],
        },
      },
    };
  }

  private async requestChat(
    model: string,
    messages: DeepSeekMessage[],
    tools: DeepSeekTool[],
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `DeepSeekChatCompletionAdapter: DeepSeek API error during requestChat: ${response.status} ${errorText}`,
      );
      throw new Error(`DeepSeek error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as unknown;
    return this.parseChatResponse(data);
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

        // tool calls, like tokens arrive fragmented, so they need to be accumulated
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

  private async handleToolCalls(
    toolCalls: DeepSeekToolCall[],
    homeId: string,
  ): Promise<DeepSeekMessage[]> {
    const responses: DeepSeekMessage[] = [];

    for (const toolCall of toolCalls) {
      console.log(
        `Handling tool call: ${toolCall.function.name} with args ${toolCall.function.arguments}`,
      );
      try {
        if (toolCall.function.name === "get_forecast_summary") {
          const coords = await this.homeService.getHomeCoordinates(homeId);
          const summary = await this.forecastPort.getForecastSummary({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          if (!summary) {
            responses.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Forecast unavailable.",
            });
            continue;
          }

          responses.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: this.formatForecast(summary),
          });
          continue;
        }

        if (toolCall.function.name === "add_rule") {
          const args = this.parseToolArguments(toolCall.function.arguments);
          const dto: AddRuleDto = {
            homeId,
            ruleName: args.ruleName,
            observableId: args.observableId,
            operator: args.operator,
            operatorTarget: args.operatorTarget,
            actions: args.actions,
          };
          const newRule = await this.ruleService.addRule(dto);
          responses.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Rule created with id ${newRule.id}.`,
          });
          continue;
        }

        responses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: "Unsupported tool call.",
        });
      } catch (error: any) {
        responses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: error?.message ?? "Tool execution failed.",
        });
      }
    }

    return responses;
  }

  private parseChatResponse(data: unknown): DeepSeekResponseDTO {
    const raw = data as {
      message?: DeepSeekResponseDTO;
      choices?: Array<{ message?: DeepSeekResponseDTO }>;
    };
    return raw.message ?? raw.choices?.[0]?.message ?? {};
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

  private parseToolArguments(raw: string): {
    ruleName: string;
    observableId: AddRuleDto["observableId"];
    operator?: AddRuleDto["operator"];
    operatorTarget: AddRuleDto["operatorTarget"];
    actions: AddRuleDto["actions"];
  } {
    try {
      return JSON.parse(raw) as {
        ruleName: string;
        observableId: AddRuleDto["observableId"];
        operator?: AddRuleDto["operator"];
        operatorTarget: AddRuleDto["operatorTarget"];
        actions: AddRuleDto["actions"];
      };
    } catch {
      throw new Error("Invalid tool arguments.");
    }
  }

  private formatForecast(summary: ForecastSummary) {
    return summary.days
      .map((day) => {
        const daylightHours = day.daylightDuration / 3600;
        return [
          `${day.date}:`,
          `${day.weatherForecast},`,
          `${day.temperatureMin.toFixed(1)}-${day.temperatureMax.toFixed(1)}C,`,
          `wind ${day.windSpeedMax.toFixed(1)} m/s ${day.windDirectionDominant.toFixed(0)} deg,`,
          `precip ${day.precipitationSum.toFixed(1)} mm (${day.precipitationHours.toFixed(1)}h),`,
          `daylight ${daylightHours.toFixed(1)}h.`,
        ].join(" ");
      })
      .join("\n");
  }
}
