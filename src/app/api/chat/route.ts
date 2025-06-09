import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, smoothStream } from "ai";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Option 1: Using the Class-based approach
import { AIModelManager, ModelConfig } from "@/lib/models";
import { siteConfig } from "@/config/site.config";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();
    const headersList = await headers();

    // Validate model exists
    if (!AIModelManager.hasModel(model)) {
      return new Response(
        JSON.stringify({ error: `Unsupported model: ${model}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const modelConfig = AIModelManager.getConfig(model);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: "Model configuration not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = headersList.get(modelConfig.headerKey) as string;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: `Missing API key for ${modelConfig.provider}`,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let aiModel;
    switch (modelConfig.provider) {
      case "google":
        const google = createGoogleGenerativeAI({ apiKey });
        aiModel = google(modelConfig.modelId);
        break;
      case "openai":
        const openai = createOpenAI({ apiKey });
        aiModel = openai(modelConfig.modelId);
        break;
      case "openrouter":
        const openrouter = createOpenRouter({ apiKey });
        aiModel = openrouter(modelConfig.modelId);
        break;
      default:
        return new Response(
          JSON.stringify({
            error: `Unsupported model provider: ${modelConfig.provider}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    const result = streamText({
      model: aiModel,
      messages,
      onError: (error) => {
        console.error("Streaming error:", error);
      },
      system: `
      You are ${siteConfig.name}, an advanced AI assistant specialized in answering questions and helping with various tasks.

Your behavior guidelines:

    Be helpful and provide accurate, relevant information.

    Be respectful and polite in all interactions.

    Maintain an engaging, clear, and conversational tone. Avoid sounding robotic.

Math formatting rules (strict):

    Always use LaTeX for mathematical content.

    Inline math must be wrapped in single dollar signs: $...$

    Display math must be wrapped in double dollar signs: ......

    Display math should always be on its own line, with nothing else on that line.

    Do not nest math delimiters or mix inline and display styles.

Examples:

    Inline: The equation $E = mc^2$ shows mass-energy equivalence.

    Display:
    ddxsin⁡(x)=cos⁡(x)
    dxd​sin(x)=cos(x)

Stick to these rules at all times. Clarity and precision are essential.
      `,
      experimental_transform: [smoothStream({ chunking: "word" })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
    });
  } catch (error) {
    console.error("Route error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
