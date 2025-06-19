import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText, smoothStream, tool } from "ai";
import { headers } from "next/headers";
import { getModelConfig, AIModel } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/app/config/site.config";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, model, enabledTools } = await req.json();
    const headersList = await headers();

    const modelConfig = getModelConfig(model as AIModel);

    const isWebSearchEnabled =
      enabledTools && enabledTools.includes("webSearch");

    const isThinkingEnabled = true;

    const isImageGenerationEnabled =
      enabledTools && enabledTools.includes("imageGeneration");

    const apiKey = headersList.get(modelConfig.headerKey) as string;

    const isImageGenerationModel =
      modelConfig.modelId === "gemini-2.0-flash-preview-image-generation";

    if (isImageGenerationModel) {
      const google = createGoogleGenerativeAI({ apiKey });

      const imageModel = google(modelConfig.modelId, {
        providerOptions: {
          google: { responseModalities: ["TEXT", "IMAGE"] },
        },
      } as any);

      const imageStreamOptions = {
        model: imageModel,
        messages,
        onError: (error: any) => {
          console.log("Image generation error:", error);
        },
        abortSignal: req.signal,
      };

      const result = streamText(imageStreamOptions);

      return result.toDataStreamResponse({
        sendReasoning: true,
        sendSources: false,
        getErrorMessage: (error) => {
          return (error as { message: string }).message;
        },
      });
    }

    let aiModel;
    let toolsConfig = {};

    switch (modelConfig.provider) {
      case "google":
        const google = createGoogleGenerativeAI({ apiKey });

        const googleOptions: any = {
          useSearchGrounding: isWebSearchEnabled,
          providerOptions: {
            google: {
              thinkingConfig: {
                thinkingBudget: 1024,
              },
              generationConfig: {
                includeThoughts: true,
              },
            },
          },
        };

        if (modelConfig.supportsImageGeneration && isImageGenerationEnabled) {
          googleOptions.providerOptions.google.responseModalities = [
            "TEXT",
            "IMAGE",
          ];
        }

        aiModel = google(modelConfig.modelId, googleOptions);
        break;

      case "openai":
        const openai = createOpenAI({ apiKey });
        aiModel = openai(modelConfig.modelId);
        break;

      case "openrouter":
        const openrouter = createOpenRouter({ apiKey });
        aiModel = openrouter(modelConfig.modelId, {});
        break;

      case "anthropic":
        const anthropic = createAnthropic({ apiKey });
        aiModel = anthropic(modelConfig.modelId);
        break;

      case "deepseek":
        const deepseek = createDeepSeek({ apiKey });
        aiModel = deepseek(modelConfig.modelId);
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported model provider" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    // Prepare options for streamText
    const streamOptions: any = {
      model: aiModel,
      messages,
      onError: (error: any) => {
        console.log("error", error);
      },
      abortSignal: req.signal,
    };

    // Add Tavily web search tool if enabled
    if (isWebSearchEnabled) {
      toolsConfig = {
        search: tool({
          description:
            "Search the web for current information. Use this when you need up-to-date information that might not be in your training data. Always explain what you're searching for and why before calling this tool.",
          parameters: z.object({
            query: z
              .string()
              .describe("The search query to find relevant information"),
          }),
          execute: async ({ query }) => {
            try {
              // Use Tavily API for web search
              const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
                },
                body: JSON.stringify({
                  query,
                  search_depth: "basic",
                  include_answer: true,
                  include_raw_content: false,
                  max_results: 5,
                }),
              });

              if (!response.ok) {
                throw new Error(`Search API error: ${response.status}`);
              }

              const data = await response.json();

              return {
                query,
                answer: data.answer || "",
                results: data.results || [],
                timestamp: new Date().toISOString(),
              };
            } catch (error) {
              console.error("Web search error:", error);
              return {
                query,
                error: "Failed to perform web search",
                results: [],
                timestamp: new Date().toISOString(),
              };
            }
          },
        }),
      };
    }

    // Add tools if available
    if (Object.keys(toolsConfig).length > 0) {
      streamOptions.tools = toolsConfig;
      streamOptions.toolChoice = "auto";
    }

    // Add system prompt and experimental transform
    streamOptions.system = `
    You are ${siteConfig.name}, an ai assistant that can answer questions and help with tasks.
    Be helpful and provide relevant information
    Be respectful and polite in all interactions.
    Be engaging and maintain a conversational tone.
    Always use LaTeX for mathematical expressions - 
    Inline math must be wrapped in single dollar signs: $content$
    Display math must be wrapped in double dollar signs: $$content$$
    Display math should be placed on its own line, with nothing else on that line.
    Do not nest math delimiters or mix styles.
    Examples:
    - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
    - Display: 
    $$\\\\frac{d}{dx}\\\\sin(x) = \\\\cos(x)$$
    
    **IMPORTANT: When you need to use tools (like searching), always explain what you're going to do BEFORE calling the tool. Provide context and describe your plan in conversational text first.**
    `;

    // Add smooth streaming for text-based models
    streamOptions.experimental_transform = [smoothStream({ chunking: "word" })];

    const result = streamText(streamOptions);

    return result.toDataStreamResponse({
      sendReasoning: true,
      sendSources: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
