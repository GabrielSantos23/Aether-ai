import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { getUser } from "@/lib/auth-uitls";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const chatId = params.id;

    // Verify chat ownership
    const existingChats = await db
      .select()
      .from(schema.chat)
      .where(and(eq(schema.chat.id, chatId), eq(schema.chat.userId, user.id)));

    if (!existingChats.length) {
      return new Response("Chat not found", { status: 404 });
    }

    // Fetch chat messages
    const messages = await db
      .select()
      .from(schema.message)
      .where(eq(schema.message.chatId, chatId))
      .orderBy(asc(schema.message.createdAt));

    // Return chat details and messages
    return new Response(
      JSON.stringify({
        chat: existingChats[0],
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        })),
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const chatId = params.id;

    // Verify chat ownership
    const existingChats = await db
      .select()
      .from(schema.chat)
      .where(and(eq(schema.chat.id, chatId), eq(schema.chat.userId, user.id)));

    if (!existingChats.length) {
      return new Response("Chat not found", { status: 404 });
    }

    // Delete all messages in the chat
    await db.delete(schema.message).where(eq(schema.message.chatId, chatId));

    // Delete the chat
    await db
      .delete(schema.chat)
      .where(and(eq(schema.chat.id, chatId), eq(schema.chat.userId, user.id)));

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
