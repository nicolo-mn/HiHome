import type { ChatCompletionPort } from "../application/ChatCompletionPort";
import type { ChatMessage } from "../application/ChatService";

type DeepSeekOptions = {
  apiKey: string;
  apiBaseUrl: string;
};

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export class DeepSeekChatCompletionAdapter implements ChatCompletionPort {
  constructor(private options: DeepSeekOptions) {}

  async completeChat(messages: ChatMessage[], model: string): Promise<string> {
    if (!this.options.apiKey) {
      throw new Error("DeepSeek API key is missing");
    }

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
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as DeepSeekResponse;

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("DeepSeek returned an empty response");
    }

    return content;
  }
}
