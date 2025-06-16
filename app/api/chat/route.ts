import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, smoothStream } from "ai";
import { headers } from "next/headers";
import { getModelConfig, AIModel } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/app/config/site.config";

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

        if (isWebSearchEnabled) {
          try {
            toolsConfig = {
              web_search_preview: {
                description: "Search the web for up-to-date information",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query to look up on the web",
                    },
                  },
                  required: ["query"],
                },
              },
            };
          } catch (error) {
            console.error("Error setting up web search tool:", error);
          }
        }
        break;

      case "openrouter":
        const openrouter = createOpenRouter({ apiKey });
        aiModel = openrouter(modelConfig.modelId, {});
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

    // Add tools if available
    if (Object.keys(toolsConfig).length > 0) {
      streamOptions.tools = toolsConfig;
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
    console.log("error", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
