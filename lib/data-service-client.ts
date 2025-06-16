"use client";

import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import type { SearchSource } from "./data-service";
import { authClient } from "./auth-client";

// Client-side data service that dynamically imports the server components
export class DataServiceClient {
  // Check if user is authenticated (to be set by the useDataService hook)
  private _isAuthenticated = false;
  private _userId: string | null = null;

  // Set authentication status
  setAuthStatus(isAuthenticated: boolean, userId: string | null) {
    console.log("DataServiceClient.setAuthStatus called:", {
      isAuthenticated,
      userId,
    });
    this._isAuthenticated = isAuthenticated;
    this._userId = userId;
  }

  // Check authentication status in real-time
  private async checkAuthStatus() {
    try {
      const { data: session } = await authClient.getSession();
      const isAuthenticated = !!session?.user;
      const userId = session?.user?.id || null;

      // Update internal state if it's different
      if (
        this._isAuthenticated !== isAuthenticated ||
        this._userId !== userId
      ) {
        console.log("Auth status changed during operation:", {
          wasAuthenticated: this._isAuthenticated,
          nowAuthenticated: isAuthenticated,
          wasUserId: this._userId,
          nowUserId: userId,
        });
        this._isAuthenticated = isAuthenticated;
        this._userId = userId;
      }

      return { isAuthenticated, userId };
    } catch (error) {
      console.error("Error checking auth status:", error);
      return { isAuthenticated: this._isAuthenticated, userId: this._userId };
    }
  }

  // Get all threads
  async getThreads() {
    console.log("DataServiceClient.getThreads called, auth state:", {
      isAuthenticated: this._isAuthenticated,
      userId: this._userId,
    });

    // Check auth status before proceeding
    const { isAuthenticated, userId } = await this.checkAuthStatus();

    try {
      if (isAuthenticated && userId) {
        console.log("Fetching threads from server API");
        // Use server-side API for authenticated users
        const response = await fetch("/api/threads");
        if (!response.ok) {
          console.error("API error:", await response.text());
          throw new Error("Failed to fetch threads from server");
        }
        const threads = await response.json();
        console.log("Threads from server API:", threads);
        return threads;
      } else {
        // Use IndexedDB via Dexie for local storage on the client
        console.log("Fetching threads from local storage");
        const { db } = await import("../frontend/dexie/db");
        const localThreads = await db.threads
          .orderBy("lastMessageAt")
          .reverse()
          .toArray();
        console.log("Local threads:", localThreads);
        return localThreads;
      }
    } catch (error) {
      console.error("Error getting threads:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        return await db.threads.orderBy("lastMessageAt").reverse().toArray();
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return [];
      }
    }
  }

  // Create a new thread
  async createThread(id: string, title: string = "New Chat") {
    console.log("DataServiceClient.createThread called:", {
      id,
      title,
      isAuthenticated: this._isAuthenticated,
    });

    // Check auth status before proceeding
    const { isAuthenticated, userId } = await this.checkAuthStatus();

    try {
      if (isAuthenticated && userId) {
        console.log("Creating thread on server");
        // Use server-side API for authenticated users
        const response = await fetch("/api/threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            title,
            userId: userId,
          }),
        });

        if (!response.ok) {
          console.error("API error:", await response.text());
          throw new Error("Failed to create thread on server");
        }

        console.log("Thread created on server successfully");
      } else {
        // Use IndexedDB via Dexie for local storage
        console.log("Creating thread locally");
        const { db } = await import("../frontend/dexie/db");
        await db.threads.add({
          id,
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageAt: new Date(),
        });
        console.log("Thread created locally");
      }
    } catch (error) {
      console.error("Error creating thread:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        await db.threads.add({
          id,
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageAt: new Date(),
        });
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Update thread title
  async updateThread(id: string, title?: string) {
    try {
      // Check auth status before proceeding
      const { isAuthenticated } = await this.checkAuthStatus();

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        const response = await fetch(`/api/threads/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          throw new Error("Failed to update thread on server");
        }
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.threads.update(id, {
          ...(title && { title }),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error updating thread:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        await db.threads.update(id, {
          ...(title && { title }),
          updatedAt: new Date(),
        });
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Delete a thread
  async deleteThread(id: string) {
    try {
      // Check auth status before proceeding
      const { isAuthenticated } = await this.checkAuthStatus();

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        const response = await fetch(`/api/threads/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete thread on server");
        }
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.transaction(
          "rw",
          [db.threads, db.messages, db.messageSummaries],
          async () => {
            await db.messages.where("threadId").equals(id).delete();
            await db.messageSummaries.where("threadId").equals(id).delete();
            await db.threads.delete(id);
          }
        );
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        await db.transaction(
          "rw",
          [db.threads, db.messages, db.messageSummaries],
          async () => {
            await db.messages.where("threadId").equals(id).delete();
            await db.messageSummaries.where("threadId").equals(id).delete();
            await db.threads.delete(id);
          }
        );
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Delete all threads
  async deleteAllThreads() {
    try {
      // Check auth status before proceeding
      const { isAuthenticated, userId } = await this.checkAuthStatus();

      if (isAuthenticated && userId) {
        // Use server-side API for authenticated users
        const response = await fetch(`/api/threads`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete all threads on server");
        }
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.transaction(
          "rw",
          [db.threads, db.messages, db.messageSummaries],
          async () => {
            await db.threads.clear();
            await db.messages.clear();
            await db.messageSummaries.clear();
          }
        );
      }
    } catch (error) {
      console.error("Error deleting all threads:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        await db.transaction(
          "rw",
          [db.threads, db.messages, db.messageSummaries],
          async () => {
            await db.threads.clear();
            await db.messages.clear();
            await db.messageSummaries.clear();
          }
        );
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Get messages by thread ID
  async getMessagesByThreadId(threadId: string) {
    try {
      // Check auth status before proceeding
      const { isAuthenticated } = await this.checkAuthStatus();

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        const response = await fetch(`/api/threads/${threadId}/messages`);

        if (!response.ok) {
          throw new Error("Failed to fetch messages from server");
        }

        const messages = await response.json();
        return messages;
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        return await db.messages
          .where("[threadId+createdAt]")
          .between([threadId, new Date(0)], [threadId, new Date()])
          .toArray();
      }
    } catch (error) {
      console.error("Error getting messages:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        return await db.messages
          .where("[threadId+createdAt]")
          .between([threadId, new Date(0)], [threadId, new Date()])
          .toArray();
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return [];
      }
    }
  }

  // Create a new message
  async createMessage(
    threadId: string,
    message: UIMessage & {
      sources?: SearchSource[];
      reasoning?: string;
      _reasoning?: string;
    },
    sources?: SearchSource[]
  ) {
    console.log("DataServiceClient.createMessage called:", {
      threadId,
      messageId: message.id,
      isAuthenticated: this._isAuthenticated,
      userId: this._userId,
    });

    // Log the actual sources and reasoning being passed
    console.log("DataServiceClient.createMessage sources:", {
      fromMessage: message.sources ? message.sources.length : 0,
      fromParam: sources ? sources.length : 0,
      sourcesData: sources || message.sources || [],
    });

    console.log("DataServiceClient.createMessage reasoning:", {
      reasoning: message.reasoning,
      _reasoning: message._reasoning,
      hasReasoning: !!(message.reasoning || message._reasoning),
    });

    // Check auth status before proceeding
    const { isAuthenticated, userId } = await this.checkAuthStatus();

    try {
      if (isAuthenticated && userId) {
        console.log("Creating message on server");

        // Prepare sources - ensure they're properly formatted
        const messageSources = sources || message.sources || [];

        // Prepare reasoning - use either reasoning or _reasoning property
        const messageReasoning = message.reasoning || message._reasoning || "";

        console.log("Sending to server API:", {
          sourcesCount: messageSources.length,
          hasReasoning: !!messageReasoning,
          reasoningLength: messageReasoning.length,
        });

        // Use server-side API for authenticated users
        const response = await fetch(`/api/threads/${threadId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: message.id,
            content: message.content,
            role: message.role,
            createdAt: message.createdAt || new Date(),
            sources: messageSources,
            reasoning: messageReasoning,
            userId: userId,
          }),
        });

        if (!response.ok) {
          console.error("API error:", await response.text());
          throw new Error("Failed to create message on server");
        }

        console.log("Message created on server successfully");

        // Update thread's last message timestamp
        await fetch(`/api/threads/${threadId}/update-timestamp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lastMessageAt: message.createdAt || new Date(),
          }),
        });
      } else {
        console.log("Saving message locally:", {
          content: message.content,
          role: message.role,
        });

        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.transaction("rw", [db.messages, db.threads], async () => {
          await db.messages.add({
            id: message.id,
            threadId,
            parts: message.parts,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt || new Date(),
            sources: sources || message.sources || [],
            reasoning: message.reasoning || message._reasoning || "",
          });

          await db.threads.update(threadId, {
            lastMessageAt: message.createdAt || new Date(),
          });
        });

        console.log("Message saved locally successfully");
      }
    } catch (error) {
      console.error("Error creating message:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        await db.transaction("rw", [db.messages, db.threads], async () => {
          await db.messages.add({
            id: message.id,
            threadId,
            parts: message.parts,
            role: message.role,
            content: message.content,
            createdAt: message.createdAt || new Date(),
            sources: sources || message.sources || [],
            reasoning: message.reasoning || message._reasoning || "",
          });

          await db.threads.update(threadId, {
            lastMessageAt: message.createdAt || new Date(),
          });
        });
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Update message sources
  async updateMessageSources(messageId: string, sources: SearchSource[]) {
    try {
      console.log("DataServiceClient.updateMessageSources called:", {
        messageId,
        sourcesCount: sources ? sources.length : 0,
      });

      // Check if this is a temporary ID
      if (messageId.startsWith("temp-")) {
        console.log(
          "Temporary message ID detected, storing sources locally only:",
          messageId
        );
        // For temporary messages, we'll only store locally
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { sources });
        console.log("Sources saved to local storage for temporary message");
        return;
      }

      // Check auth status before proceeding
      const { isAuthenticated, userId } = await this.checkAuthStatus();

      console.log("Auth status for sources update:", {
        isAuthenticated,
        userId,
      });

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        console.log("Sending sources to server API");
        const response = await fetch(`/api/messages/${messageId}/sources`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sources }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error("Failed to update message sources on server");
        }

        console.log("Sources successfully saved to server");
      } else {
        // Use IndexedDB via Dexie for local storage
        console.log("Saving sources to local storage");
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { sources });
        console.log("Sources saved to local storage");
      }
    } catch (error) {
      console.error("Error updating message sources:", error);
      // Fallback to local storage if server request fails
      try {
        console.log("Fallback: Saving sources to local storage");
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { sources });
        console.log("Sources saved to local storage (fallback)");
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Delete trailing messages
  async deleteTrailingMessages(
    threadId: string,
    createdAt: Date,
    gte: boolean = true
  ) {
    try {
      // Check auth status before proceeding
      const { isAuthenticated } = await this.checkAuthStatus();

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        const response = await fetch(`/api/threads/${threadId}/messages`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            createdAt: createdAt.toISOString(),
            gte,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete trailing messages on server");
        }
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        const startKey = gte
          ? [threadId, createdAt]
          : [threadId, new Date(createdAt.getTime() + 1)];
        const endKey = [threadId, new Date()];

        await db.transaction(
          "rw",
          [db.messages, db.messageSummaries],
          async () => {
            const messagesToDelete = await db.messages
              .where("[threadId+createdAt]")
              .between(startKey, endKey)
              .toArray();

            const messageIds = messagesToDelete.map((msg) => msg.id);

            await db.messages
              .where("[threadId+createdAt]")
              .between(startKey, endKey)
              .delete();

            if (messageIds.length > 0) {
              await db.messageSummaries
                .where("messageId")
                .anyOf(messageIds)
                .delete();
            }
          }
        );
      }
    } catch (error) {
      console.error("Error deleting trailing messages:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        const startKey = gte
          ? [threadId, createdAt]
          : [threadId, new Date(createdAt.getTime() + 1)];
        const endKey = [threadId, new Date()];

        await db.transaction(
          "rw",
          [db.messages, db.messageSummaries],
          async () => {
            const messagesToDelete = await db.messages
              .where("[threadId+createdAt]")
              .between(startKey, endKey)
              .toArray();

            const messageIds = messagesToDelete.map((msg) => msg.id);

            await db.messages
              .where("[threadId+createdAt]")
              .between(startKey, endKey)
              .delete();

            if (messageIds.length > 0) {
              await db.messageSummaries
                .where("messageId")
                .anyOf(messageIds)
                .delete();
            }
          }
        );
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Create message summary
  async createMessageSummary(
    threadId: string,
    messageId: string,
    content: string
  ) {
    try {
      // Check auth status before proceeding
      const { isAuthenticated } = await this.checkAuthStatus();

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        const response = await fetch(`/api/messages/${messageId}/summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId,
            content,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create message summary on server");
        }
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.messageSummaries.add({
          id: uuidv4(),
          threadId,
          messageId,
          content,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error creating message summary:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        await db.messageSummaries.add({
          id: uuidv4(),
          threadId,
          messageId,
          content,
          createdAt: new Date(),
        });
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }

  // Get message summaries
  async getMessageSummaries(threadId: string) {
    try {
      // Check auth status before proceeding
      const { isAuthenticated } = await this.checkAuthStatus();

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        const response = await fetch(`/api/threads/${threadId}/summaries`);

        if (!response.ok) {
          throw new Error("Failed to fetch message summaries from server");
        }

        const summaries = await response.json();
        return summaries;
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        return await db.messageSummaries
          .where("[threadId+createdAt]")
          .between([threadId, new Date(0)], [threadId, new Date()])
          .toArray();
      }
    } catch (error) {
      console.error("Error getting message summaries:", error);
      // Fallback to local storage if server request fails
      try {
        const { db } = await import("../frontend/dexie/db");
        return await db.messageSummaries
          .where("[threadId+createdAt]")
          .between([threadId, new Date(0)], [threadId, new Date()])
          .toArray();
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return [];
      }
    }
  }

  // Update message reasoning
  async updateMessageReasoning(messageId: string, reasoning: string) {
    try {
      console.log("DataServiceClient.updateMessageReasoning called:", {
        messageId,
        reasoningLength: reasoning ? reasoning.length : 0,
        reasoningPreview: reasoning
          ? reasoning.substring(0, 50) + "..."
          : "null",
      });

      // Check if this is a temporary ID
      if (messageId.startsWith("temp-")) {
        console.log(
          "Temporary message ID detected, storing reasoning locally only:",
          messageId
        );
        // For temporary messages, we'll only store locally
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { reasoning });
        console.log("Reasoning saved to local storage for temporary message");
        return;
      }

      // Check auth status before proceeding
      const { isAuthenticated, userId } = await this.checkAuthStatus();

      console.log("Auth status for reasoning update:", {
        isAuthenticated,
        userId,
      });

      if (isAuthenticated) {
        // Use server-side API for authenticated users
        console.log("Sending reasoning to server API");
        const response = await fetch(`/api/messages/${messageId}/reasoning`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reasoning }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error("Failed to update message reasoning on server");
        }

        console.log("Reasoning successfully saved to server");
      } else {
        // Use IndexedDB via Dexie for local storage
        console.log("Saving reasoning to local storage");
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { reasoning });
        console.log("Reasoning saved to local storage");
      }
    } catch (error) {
      console.error("Error updating message reasoning:", error);
      // Fallback to local storage if server request fails
      try {
        console.log("Fallback: Saving reasoning to local storage");
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { reasoning });
        console.log("Reasoning saved to local storage (fallback)");
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
  }
}

// Export singleton instance
export const dataServiceClient = new DataServiceClient();
