import type { ChatCompletionPort } from "../application/ChatCompletionPort";
import type { ChatMessage } from "../application/ChatService";
import type {
  ForecastPort,
  ForecastSummary,
} from "../application/ForecastPort";
import { HomeService } from "../application/HomeService";
import type { AddRuleDto } from "../../rule-context/application/RuleService";
import { RuleService } from "../../rule-context/application/RuleService";
// TODO: markdown reader in frontend
// TODO: add streaming and tool call UI elements
type DeepSeekOptions = {
  apiKey: string;
  apiBaseUrl: string;
};

type DeepSeekResponse = {
  choices?: Array<{ message?: DeepSeekAssistantMessage }>;
};

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

type DeepSeekToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type DeepSeekMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  reasoning_content?: string | null;
  tool_call_id?: string;
  tool_calls?: DeepSeekToolCall[];
};

type DeepSeekAssistantMessage = {
  content?: string | null;
  reasoning_content?: string | null;
  tool_calls?: DeepSeekToolCall[];
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
          "Actions is a non-empty array; each action has componentType (light|window|thermostat), command (turnOn|turnOff|open|close|setTemperature), componentId, and targetTemp required only when command is setTemperature.",
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
  ): Promise<DeepSeekAssistantMessage> {
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
      throw new Error(`DeepSeek error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as DeepSeekResponse;
    return data.choices?.[0]?.message ?? {};
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
