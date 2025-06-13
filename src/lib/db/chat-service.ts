import { db } from "../db";
import { chat, message } from "./schema";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Types matching our Zustand store
export type ChatDB = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  metadata?: Record<string, any>;
  messages: MessageDB[];
};

export type MessageDB = {
  id: string;
  chatId: string;
  userId: string;
  role: "user" | "assistant";
  content: any; // Can be string or multimodal content
  webSearch: boolean;
  thinking: boolean;
  reasoning?: string;
  sources?: any[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  imageAnalysis?: any;
};

// Chat CRUD operations
export async function getUserChats(userId: string): Promise<ChatDB[]> {
  try {
    // Get all chats for the user
    const chats = await db.query.chat.findMany({
      where: eq(chat.userId, userId),
      orderBy: (chat) => [chat.updatedAt],
    });

    // Get all messages for these chats
    const chatIds = chats.map((chat) => chat.id);
    const messages = chatIds.length
      ? await db.query.message.findMany({
          where: inArray(message.chatId, chatIds),
          orderBy: (message) => [message.createdAt],
        })
      : [];

    // Group messages by chatId
    const messagesByChatId = messages.reduce((acc, msg) => {
      if (!acc[msg.chatId]) {
        acc[msg.chatId] = [];
      }
      acc[msg.chatId].push({
        ...msg,
        role: msg.role as "user" | "assistant",
        reasoning: msg.reasoning === null ? undefined : msg.reasoning,
        sources: Array.isArray(msg.sources) ? msg.sources : undefined,
        model: msg.model === null ? undefined : msg.model,
      });
      return acc;
    }, {} as Record<string, MessageDB[]>);

    // Combine chats with their messages
    return chats.map((chat) => ({
      ...chat,
      parentId: chat.parentId === null ? undefined : chat.parentId,
      metadata: chat.metadata as Record<string, any> | undefined,
      messages: messagesByChatId[chat.id] || [],
    }));
  } catch (error) {
    console.error("Failed to get user chats:", error);
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
        title: chatData.title,
        createdAt: now,
        updatedAt: now,
        parentId: chatData.parentId,
        metadata: chatData.metadata,
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
  updates: Partial<Omit<ChatDB, "id" | "userId" | "messages" | "createdAt">>
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
    // Delete all messages first (cascade should handle this, but being explicit)
    await db.delete(message).where(eq(message.chatId, chatId));
    // Then delete the chat
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
        imageAnalysis: msg.imageAnalysis,
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
    // Begin transaction
    await db.transaction(async (tx) => {
      // Check if chat exists
      const existingChat = await tx.query.chat.findFirst({
        where: eq(chat.id, chatData.id),
      });

      if (existingChat) {
        // Update existing chat
        await tx
          .update(chat)
          .set({
            title: chatData.title,
            updatedAt: new Date(),
            parentId: chatData.parentId,
            metadata: chatData.metadata,
          })
          .where(eq(chat.id, chatData.id));
      } else {
        // Create new chat
        await tx.insert(chat).values({
          id: chatData.id,
          userId: chatData.userId,
          title: chatData.title,
          createdAt:
            chatData.createdAt instanceof Date
              ? chatData.createdAt
              : new Date(chatData.createdAt),
          updatedAt:
            chatData.updatedAt instanceof Date
              ? chatData.updatedAt
              : new Date(chatData.updatedAt),
          parentId: chatData.parentId,
          metadata: chatData.metadata,
        });
      }

      // Handle messages
      for (const msg of chatData.messages) {
        const existingMessage = await tx.query.message.findFirst({
          where: eq(message.id, msg.id),
        });

        if (existingMessage) {
          // Update existing message
          await tx
            .update(message)
            .set({
              content: msg.content,
              role: msg.role,
              webSearch: msg.webSearch || false,
              thinking: msg.thinking || false,
              reasoning: msg.reasoning,
              sources: msg.sources,
              model: msg.model,
              imageAnalysis: msg.imageAnalysis,
              updatedAt: new Date(),
            })
            .where(eq(message.id, msg.id));
        } else {
          // Create new message
          await tx.insert(message).values({
            id: msg.id,
            chatId: chatData.id,
            userId: chatData.userId,
            content: msg.content,
            role: msg.role,
            webSearch: msg.webSearch || false,
            thinking: msg.thinking || false,
            reasoning: msg.reasoning,
            sources: msg.sources,
            createdAt:
              msg.createdAt instanceof Date
                ? msg.createdAt
                : new Date(msg.createdAt),
            updatedAt:
              msg.updatedAt instanceof Date
                ? msg.updatedAt
                : new Date(msg.updatedAt),
            model: msg.model,
            imageAnalysis: msg.imageAnalysis,
          });
        }
      }
    });
  } catch (error) {
    console.error(`Failed to sync chat ${chatData.id}:`, error);
    throw error;
  }
}
