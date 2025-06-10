import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-uitls";

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const {
      messages,
      chatId,
      provider = "openai",
      model,
      apiKey,
    } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages are required", { status: 400 });
    }

    // Handle chat creation or retrieval
    let currentChatId = chatId;

    if (!currentChatId) {
      // Create new chat
      currentChatId = nanoid();
      const title = messages[0]?.content?.slice(0, 100) || "New Chat";

      await db.insert(schema.chat).values({
        id: currentChatId,
        title,
        userId: user.id,
        createdAt: new Date(),
      });
    } else {
      // Verify chat ownership
      try {
        const existingChats = await db
          .select()
          .from(schema.chat)
          .where(
            and(
              eq(schema.chat.id, currentChatId),
              eq(schema.chat.userId, user.id)
            )
          );

        if (!existingChats.length) {
          return new Response("Chat not found", { status: 404 });
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
        return new Response("Error verifying chat ownership", { status: 500 });
      }
    }

    // Save user message
    const userMessage = messages[messages.length - 1];
    if (userMessage?.role === "user") {
      await db.insert(schema.message).values({
        id: nanoid(),
        chatId: currentChatId,
        role: "user",
        content: userMessage.content,
        createdAt: new Date(),
      });
    }

    // Configure AI provider
    let aiModel;

    if (provider === "google") {
      const googleModel = model || "gemini-1.5-pro-latest";
      // Create custom Google provider with API key if provided
      const customGoogle = apiKey
        ? createGoogleGenerativeAI({ apiKey })
        : google;
      aiModel = customGoogle(googleModel);
    } else {
      const openaiModel = model || "gpt-4o-mini";
      // Create custom OpenAI provider with API key if provided
      const customOpenAI = apiKey ? createOpenAI({ apiKey }) : openai;
      aiModel = customOpenAI(openaiModel);
    }

    // Stream the AI response
    const result = await streamText({
      model: aiModel,
      messages,
      system:
        "You are a helpful assistant. Provide clear, accurate, and helpful responses.",
    });

    // Save assistant message after streaming completes
    result.text
      .then(async (finalText) => {
        await db.insert(schema.message).values({
          id: nanoid(),
          chatId: currentChatId,
          role: "assistant",
          content: finalText,
          createdAt: new Date(),
        });
      })
      .catch((error) => {
        console.error("Failed to save assistant message:", error);
      });

    // Create response with chat ID header
    const response = result.toDataStreamResponse();

    if (!chatId) {
      response.headers.set("x-chat-id", currentChatId);
    }

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
