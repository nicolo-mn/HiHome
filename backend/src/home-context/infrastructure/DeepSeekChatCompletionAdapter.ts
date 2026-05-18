import type { ChatCompletionPort } from "../application/ChatCompletionPort";
import type { ChatMessage } from "../application/ChatService";
import type {
  ForecastPort,
  ForecastSummary,
} from "../application/ForecastPort";
import { HomeService } from "../application/HomeService";

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
  ) {}

  async completeChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
  ): Promise<string> {
    if (!this.options.apiKey) {
      throw new Error("DeepSeek API key is missing");
    }

    const tools = [this.buildForecastTool()];
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
      if (toolCall.function.name !== "get_forecast_summary") {
        responses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: "Unsupported tool call.",
        });
        continue;
      }

      try {
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
      } catch {
        responses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: "Forecast unavailable.",
        });
      }
    }

    return responses;
  }

  private formatForecast(summary: ForecastSummary) {
    return [
      `Temperature ${summary.temperature.toFixed(1)}C,`,
      `${summary.weatherDescription}.`,
      `Wind ${summary.windSpeed.toFixed(1)} m/s at ${summary.windDirection.toFixed(0)} deg.`,
      `Precipitation ${summary.precipitation.toFixed(1)} mm.`,
      `European AQI ${summary.europeanAqi}.`,
    ].join(" ");
  }
}
