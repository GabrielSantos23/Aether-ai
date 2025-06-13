import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, createDataStreamResponse } from "ai";
import { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { OpenAI } from "openai";
import { findModelConfig } from "@/lib/models";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      apiKey,
      selectedModel,
      useWebSearch,
      useThinking,
      experimental_attachments,
    } = await req.json();

    // Get model configuration based on the selected model
    const modelConfig = findModelConfig(selectedModel);

    if (!modelConfig) {
      return new Response(JSON.stringify({ error: "Invalid model selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      provider,
      modelId,
      headerKey,
      supportsWebSearch,
      supportsThinking,
      viewImage,
    } = modelConfig;

    // Check for API key
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `Missing ${provider} API key` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Enforce model capabilities
    const effectiveWebSearch = supportsWebSearch && useWebSearch;
    const effectiveThinking = supportsThinking && useThinking;

    // --- Multimodal image support ---
    let patchedMessages = messages;
    if (
      viewImage &&
      Array.isArray(messages) &&
      Array.isArray(experimental_attachments) &&
      experimental_attachments.length > 0
    ) {
      // Only patch the last user message
      const lastIdx = messages.length - 1;
      const lastMsg = messages[lastIdx];
      if (lastMsg && lastMsg.role === "user") {
        const newContent = [
          { type: "text", text: lastMsg.content },
          // For now, only support the first image
          { type: "image", image: experimental_attachments[0] },
        ];
        patchedMessages = [
          ...messages.slice(0, lastIdx),
          { ...lastMsg, content: newContent },
        ];
      }
    }
    // Configure model options
    const streamOptions: any = {
      messages: patchedMessages,
    };

    // Set up system prompt
    const systemPrompt = `You are a helpful assistant.
- For code blocks, always use Markdown syntax with the language specified (e.g., \`\`\`javascript).
- For mathematical formulas, use LaTeX syntax. Use $...$ for inline formulas and $$...$$ for block formulas.
- Format text using Markdown (bold, italics, lists, etc.) when appropriate to improve clarity.
${
  effectiveWebSearch
    ? "- When using web search, always cite your sources at the end of your response."
    : ""
}
${
  effectiveThinking
    ? `- For complex problems or questions, show your reasoning by:
  1. First working through the problem step-by-step
  2. Carefully considering multiple approaches and evaluating tradeoffs
  3. If any calculation is needed, show your work clearly
  4. When providing code, explain your implementation choices
  5. Preface your reasoning with "### My reasoning:" and end it with "### Final answer:" to clearly separate it from your final answer`
    : ""
}`;

    // Initialize the appropriate provider based on the model
    let model;
    let providerOptions = {};

    if (provider === "google") {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey,
      });

      const googleModelConfig: any = {};
      if (effectiveWebSearch) {
        googleModelConfig.useSearchGrounding = true;
      }

      if (effectiveThinking) {
        providerOptions = {
          google: {
            thinkingConfig: {
              includeThoughts: true,
              thinkingBudget: 12000,
            },
          } as GoogleGenerativeAIProviderOptions,
        };
      }

      model = google(modelId, googleModelConfig);
      streamOptions.system = systemPrompt;
    } else if (provider === "openai") {
      const openai = createOpenAI({
        apiKey: apiKey,
      });

      const openaiModelConfig: any = {};
      if (effectiveWebSearch) {
        // Add web search tool for OpenAI
        streamOptions.tools = {
          web_search_preview: {},
        };

        if (effectiveWebSearch) {
          streamOptions.toolChoice = {
            type: "tool",
            toolName: "web_search_preview",
          };
        }
      }

      model = openai(modelId, openaiModelConfig);
      streamOptions.system = systemPrompt;
    } else if (provider === "openrouter") {
      const openrouter = createOpenRouter({
        apiKey: apiKey,
        headers: {
          "HTTP-Referer": "https://aether.chat",
          "X-Title": "Aether Chat",
        },
      });

      model = openrouter(modelId);

      // For OpenRouter models with thinking capability, we need to modify the system prompt
      // to extract the thinking process from the response
      if (effectiveThinking) {
        // Add special instructions for OpenRouter models to handle thinking
        streamOptions.system = `${systemPrompt}
        
If you're solving a complex problem or answering a detailed question, please structure your response as follows:

### My reasoning:
[Your step-by-step thought process here]

### Final answer:
[Your final response here]

This format helps me understand your thinking process better.`;
      } else {
        streamOptions.system = systemPrompt;
      }
    } else {
      return new Response(JSON.stringify({ error: "Unsupported provider" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    streamOptions.model = model;

    if (Object.keys(providerOptions).length > 0) {
      streamOptions.providerOptions = providerOptions;
    }

    const collectedSources: any[] = [];

    return createDataStreamResponse({
      execute: async (dataStream) => {
        let reasoningBuffer = "";

        try {
          const result = streamText({
            ...streamOptions,
            onChunk: ({ chunk }) => {
              if (chunk.type === "source") {
                collectedSources.push(chunk.source);

                dataStream.writeData({
                  type: "source",
                  source: chunk.source,
                });

                console.log("Source detected:", chunk.source);
              }

              if (chunk.type === "reasoning") {
                console.log("Streaming reasoning chunk:", chunk.textDelta);

                if (chunk.textDelta) {
                  reasoningBuffer += chunk.textDelta;

                  dataStream.writeData({
                    type: "reasoning",
                    text: reasoningBuffer,
                  });
                }
              }
            },
          });

          result.mergeIntoDataStream(dataStream);
        } catch (error) {
          console.error("Error during streaming:", error);
          // Let the error propagate naturally to be handled by the onError function
          throw error;
        }
      },
      onError: (error) => {
        console.error("Data stream error:", error);
        return error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "An unknown error occurred";
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
