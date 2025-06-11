import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, createDataStreamResponse } from "ai";
import { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, geminiApiKey, useWebSearch, useThinking } =
      await req.json();

    const apiKey = geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing Gemini API key" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    // Create model config based on options
    const modelConfig: any = {};

    // Add web search if enabled
    if (useWebSearch) {
      modelConfig.useSearchGrounding = true;
    }

    // Select the appropriate model based on thinking preference
    // Gemini 1.5 Flash is good for standard usage
    // For thinking capabilities, Gemini 1.5 Pro is better suited
    const modelName = useThinking
      ? "gemini-2.5-flash-preview-04-17"
      : "gemini-2.5-flash-preview-04-17";

    // Create provider options
    const providerOptions: { google?: GoogleGenerativeAIProviderOptions } = {};

    // Configure thinking if enabled
    if (useThinking) {
      providerOptions.google = {
        thinkingConfig: {
          includeThoughts: true,
          thinkingBudget: 12000, // Larger budget for more detailed reasoning
        },
        // Note: streamMode is not directly supported in the type definition
      };
    }

    // System message with thinking instructions if needed
    const systemPrompt = `You are a helpful assistant.
- For code blocks, always use Markdown syntax with the language specified (e.g., \`\`\`javascript).
- For mathematical formulas, use LaTeX syntax. Use $...$ for inline formulas and $$...$$ for block formulas.
- Format text using Markdown (bold, italics, lists, etc.) when appropriate to improve clarity.
${
  useWebSearch
    ? "- When using web search, always cite your sources at the end of your response."
    : ""
}
${
  useThinking
    ? `- For complex problems or questions, show your reasoning by:
  1. First working through the problem step-by-step
  2. Carefully considering multiple approaches and evaluating tradeoffs
  3. If any calculation is needed, show your work clearly
  4. When providing code, explain your implementation choices
  5. Preface your reasoning with "### My reasoning:" and end it with "### Final answer:" to clearly separate it from your final answer`
    : ""
}`;

    // Use a custom data stream to handle both web search and thinking
    return createDataStreamResponse({
      execute: async (dataStream) => {
        let reasoningBuffer = "";

        const result = streamText({
          model: google(modelName, modelConfig),
          system: systemPrompt,
          messages,
          providerOptions: providerOptions,
          onChunk: ({ chunk }) => {
            if (chunk.type === "source") {
              dataStream.writeSource(chunk.source);
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
