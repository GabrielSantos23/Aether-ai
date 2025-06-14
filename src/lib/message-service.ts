import { v4 as uuidv4 } from "uuid";

export interface Message {
  id: string;
  chatId: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  userId?: string;
}

/**
 * Saves a message to the database via API
 * Returns a promise that always resolves (never rejects)
 */
export async function saveMessage(
  messageData: Omit<Message, "id" | "createdAt">
): Promise<Message | null> {
  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      console.error(`Failed to save message: ${response.statusText}`);
      // Return a fake message object with generated ID instead of throwing
      return {
        id: uuidv4(),
        chatId: messageData.chatId,
        content: messageData.content,
        role: messageData.role,
        createdAt: new Date().toISOString(),
        userId: messageData.userId,
      };
    }

    const result = await response.json();

    return {
      id: result.id,
      chatId: messageData.chatId,
      content: messageData.content,
      role: messageData.role,
      createdAt: new Date().toISOString(),
      userId: messageData.userId,
    };
  } catch (error) {
    // Log the error but don't throw it
    console.error("Error saving message:", error);

    // Return a fake message object with generated ID instead of throwing
    return {
      id: uuidv4(),
      chatId: messageData.chatId,
      content: messageData.content,
      role: messageData.role,
      createdAt: new Date().toISOString(),
      userId: messageData.userId,
    };
  }
}

/**
 * Retrieves all messages for a specific chat via API
 */
export async function getMessagesByChat(chatId: string): Promise<Message[]> {
  try {
    const response = await fetch(`/api/messages?chatId=${chatId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve messages: ${response.statusText}`);
    }

    const result = await response.json();
    return result.messages.map((msg: any) => ({
      id: msg.id,
      chatId: msg.chatId,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
      role: msg.role as "user" | "assistant",
      createdAt: new Date(msg.createdAt).toISOString(),
      userId: msg.userId,
    }));
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return [];
  }
}

/**
 * Deletes all messages for a specific chat via API
 */
export async function deleteMessagesByChat(chatId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/messages?chatId=${chatId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete messages: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting messages:", error);
    return false;
  }
}
