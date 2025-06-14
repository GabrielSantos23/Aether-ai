import { db } from "../db";
import { chat, message } from "./schema";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Types matching our Zustand store
export type ChatDB = {
  id: string;
  userId: string;
  creatorId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
  messages: MessageDB[];
};

export type MessageDB = {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  webSearch?: boolean;
  thinking?: boolean;
  reasoning?: string;
  sources?: any;
};

// Chat CRUD operations
export async function getUserChats(userId: string): Promise<ChatDB[]> {
  try {
    const chats = await db.query.chat.findMany({
      where: eq(chat.userId, userId),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
    });

    const chatIds = chats.map((c) => c.id);

    if (chatIds.length === 0) {
      return [];
    }

    const messages = await db.query.message.findMany({
      where: inArray(message.chatId, chatIds),
      orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    });

    // Convert DB types to our internal types
    return chats.map((c) => ({
      id: c.id,
      userId: c.userId,
      creatorId: c.creatorId || c.userId, // Fallback for older records
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      parentId: c.parentId || undefined, // Convert null to undefined
      metadata: c.metadata || undefined,
      isPublic: c.isPublic || false,
      messages: messages
        .filter((m) => m.chatId === c.id)
        .map((m) => ({
          id: m.id,
          chatId: m.chatId,
          userId: m.userId,
          content: String(m.content), // Ensure content is string
          role: m.role as "user" | "assistant",
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          model: m.model || undefined,
          webSearch: m.webSearch || false,
          thinking: m.thinking || false,
          reasoning: m.reasoning || undefined,
          sources: m.sources || undefined,
        })),
    }));
  } catch (error) {
    console.error("Failed to get user chats:", error);
    throw error;
  }
}

export async function getChat(chatId: string): Promise<ChatDB | null> {
  try {
    const chatResult = await db.query.chat.findFirst({
      where: eq(chat.id, chatId),
    });

    if (!chatResult) {
      return null;
    }

    const messages = await db.query.message.findMany({
      where: eq(message.chatId, chatId),
      orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    });

    // Convert DB types to our internal types
    return {
      id: chatResult.id,
      userId: chatResult.userId,
      creatorId: chatResult.creatorId || chatResult.userId,
      title: chatResult.title,
      createdAt: chatResult.createdAt,
      updatedAt: chatResult.updatedAt,
      parentId: chatResult.parentId || undefined,
      metadata: chatResult.metadata || undefined,
      isPublic: chatResult.isPublic || false,
      messages: messages.map((m) => ({
        id: m.id,
        chatId: m.chatId,
        userId: m.userId,
        content: String(m.content),
        role: m.role as "user" | "assistant",
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        model: m.model || undefined,
        webSearch: m.webSearch || false,
        thinking: m.thinking || false,
        reasoning: m.reasoning || undefined,
        sources: m.sources || undefined,
      })),
    };
  } catch (error) {
    console.error(`Failed to get chat ${chatId}:`, error);
    throw error;
  }
}

export async function createChat(
  chatData: Omit<ChatDB, "messages" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const now = new Date();
    const [newChat] = await db
      .insert(chat)
      .values({
        id: chatData.id || uuidv4(),
        userId: chatData.userId,
        creatorId: chatData.creatorId || chatData.userId, // Default creator to user if not specified
        title: chatData.title,
        createdAt: now,
        updatedAt: now,
        parentId: chatData.parentId,
        metadata: chatData.metadata,
        isPublic: chatData.isPublic || false,
      })
      .returning();

    return newChat.id;
  } catch (error) {
    console.error("Failed to create chat:", error);
    throw error;
  }
}

export async function updateChat(
  chatId: string,
  updates: Partial<Omit<ChatDB, "id" | "messages">>
): Promise<void> {
  try {
    await db
      .update(chat)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.error(`Failed to update chat ${chatId}:`, error);
    throw error;
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  try {
    await db.delete(chat).where(eq(chat.id, chatId));
  } catch (error) {
    console.error(`Failed to delete chat ${chatId}:`, error);
    throw error;
  }
}

// Message CRUD operations
export async function createMessage(
  msg: Omit<MessageDB, "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const now = new Date();
    const [newMessage] = await db
      .insert(message)
      .values({
        id: msg.id || uuidv4(),
        chatId: msg.chatId,
        userId: msg.userId,
        content: msg.content,
        role: msg.role,
        webSearch: msg.webSearch || false,
        thinking: msg.thinking || false,
        reasoning: msg.reasoning,
        sources: msg.sources,
        createdAt: now,
        updatedAt: now,
        model: msg.model,
      })
      .returning();

    return newMessage.id;
  } catch (error) {
    console.error("Failed to create message:", error);
    throw error;
  }
}

export async function updateMessage(
  messageId: string,
  updates: Partial<Omit<MessageDB, "id" | "chatId" | "userId" | "createdAt">>
): Promise<void> {
  try {
    await db
      .update(message)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(message.id, messageId));
  } catch (error) {
    console.error(`Failed to update message ${messageId}:`, error);
    throw error;
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  try {
    await db.delete(message).where(eq(message.id, messageId));
  } catch (error) {
    console.error(`Failed to delete message ${messageId}:`, error);
    throw error;
  }
}

// Batch operations for efficiency
export async function syncChatWithMessages(chatData: ChatDB): Promise<void> {
  try {
    // First, ensure the chat exists
    const existingChat = await db.query.chat.findFirst({
      where: eq(chat.id, chatData.id),
    });

    if (existingChat) {
      // Update the existing chat
      await db
        .update(chat)
        .set({
          title: chatData.title,
          updatedAt: chatData.updatedAt || new Date(),
          parentId: chatData.parentId,
          metadata: chatData.metadata,
          isPublic: chatData.isPublic,
        })
        .where(eq(chat.id, chatData.id));
    } else {
      // Create a new chat
      await db.insert(chat).values({
        id: chatData.id,
        userId: chatData.userId,
        creatorId: chatData.creatorId || chatData.userId,
        title: chatData.title,
        createdAt: chatData.createdAt || new Date(),
        updatedAt: chatData.updatedAt || new Date(),
        parentId: chatData.parentId,
        metadata: chatData.metadata,
        isPublic: chatData.isPublic || false,
      });
    }

    // Get existing messages for this chat
    const existingMessages = await db.query.message.findMany({
      where: eq(message.chatId, chatData.id),
    });

    const existingMessageIds = new Set(existingMessages.map((m) => m.id));

    // Process each message
    for (const msg of chatData.messages) {
      if (existingMessageIds.has(msg.id)) {
        // Update existing message
        await db
          .update(message)
          .set({
            content: msg.content,
            updatedAt: msg.updatedAt || new Date(),
            model: msg.model,
            webSearch: msg.webSearch,
            thinking: msg.thinking,
            reasoning: msg.reasoning,
            sources: msg.sources,
          })
          .where(eq(message.id, msg.id));
      } else {
        // Insert new message
        await db.insert(message).values({
          id: msg.id,
          chatId: chatData.id,
          userId: msg.userId,
          content: msg.content,
          role: msg.role,
          createdAt: msg.createdAt || new Date(),
          updatedAt: msg.updatedAt || new Date(),
          model: msg.model,
          webSearch: msg.webSearch,
          thinking: msg.thinking,
          reasoning: msg.reasoning,
          sources: msg.sources,
        });
      }
    }
  } catch (error) {
    console.error(`Failed to sync chat ${chatData.id}:`, error);
    throw error;
  }
}
