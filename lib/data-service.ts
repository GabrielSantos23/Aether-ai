import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { db, InsertMessage, InsertMessageSource, InsertThread } from "./db";
import { authClient } from "./auth-client";
import { supabase } from "./supabase";
import { eq, and } from "drizzle-orm";
import {
  messages,
  messageSources,
  messageSummaries,
  threads,
  messageReasonings,
} from "./db/schema";

// Type for search sources
export interface SearchSource {
  id?: string;
  title?: string;
  url: string;
  snippet?: string;
}

// Service to handle database operations
export class DataService {
  // Check if user is authenticated
  private async isAuthenticated(): Promise<boolean> {
    try {
      const { data: session } = await authClient.getSession();
      console.log("Auth session check:", {
        hasSession: !!session,
        hasUser: !!session?.user,
      });
      return !!session?.user;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: session } = await authClient.getSession();
      const userId = session?.user?.id || null;
      console.log("Current user ID:", userId);
      return userId;
    } catch (error) {
      console.error("Error getting current user ID:", error);
      return null;
    }
  }

  // Get all threads
  async getThreads() {
    try {
      const isAuth = await this.isAuthenticated();
      const userId = await this.getCurrentUserId();

      console.log("Auth status:", { isAuth, userId });

      if (isAuth && userId) {
        // Get threads from Supabase
        const result = await db
          .select()
          .from(threads)
          .where(eq(threads.userId, userId))
          .orderBy(threads.lastMessageAt);

        console.log("Supabase threads:", result);
        return result.reverse();
      } else {
        // Use IndexedDB via Dexie for local storage
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
      return [];
    }
  }

  // Create a new thread
  async createThread(id: string, title: string = "New Chat") {
    try {
      const isAuth = await this.isAuthenticated();
      const userId = await this.getCurrentUserId();

      console.log("Creating thread with auth status:", { isAuth, userId });

      if (isAuth && userId) {
        // Create thread in Supabase
        await db.insert(threads).values({
          id,
          title,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageAt: new Date(),
        });
        console.log("Thread created in Supabase");
      } else {
        // Use IndexedDB via Dexie for local storage
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
    }
  }

  // Update thread title
  async updateThread(id: string, title: string) {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Update thread in Supabase
        await db
          .update(threads)
          .set({ title, updatedAt: new Date() })
          .where(eq(threads.id, id));
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.threads.update(id, {
          title,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error updating thread:", error);
    }
  }

  // Delete a thread
  async deleteThread(id: string) {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Delete thread in Supabase (cascade will delete messages)
        await db.delete(threads).where(eq(threads.id, id));
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
    }
  }

  // Delete all threads
  async deleteAllThreads() {
    try {
      const isAuth = await this.isAuthenticated();
      const userId = await this.getCurrentUserId();

      if (isAuth && userId) {
        // Delete all threads for this user in Supabase
        await db.delete(threads).where(eq(threads.userId, userId));
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
    }
  }

  // Get messages by thread ID
  async getMessagesByThreadId(threadId: string) {
    try {
      const isAuth = await this.isAuthenticated();
      console.log("getMessagesByThreadId - Auth status:", isAuth);

      if (isAuth) {
        // Get messages from Supabase
        const result = await db
          .select()
          .from(messages)
          .where(eq(messages.threadId, threadId))
          .orderBy(messages.createdAt);

        console.log(
          "getMessagesByThreadId - Raw messages from DB:",
          result.map((msg) => ({
            id: msg.id,
            role: msg.role,
            hasSourcesField: msg.sources !== undefined,
            sourcesType: msg.sources ? typeof msg.sources : "undefined",
            sourcesValue: msg.sources,
            hasReasoningField: msg.reasoning !== undefined,
            reasoningType: msg.reasoning ? typeof msg.reasoning : "undefined",
            reasoningPreview: msg.reasoning
              ? msg.reasoning.substring(0, 50) + "..."
              : null,
          }))
        );

        // Process messages to ensure proper format
        const processedMessages = result.map((message) => {
          // Parse sources JSON if it exists
          let sources = [];
          if (message.sources) {
            try {
              sources = JSON.parse(message.sources);
              console.log(
                `getMessagesByThreadId - Successfully parsed sources for message ${message.id}:`,
                sources.length > 0
                  ? `${sources.length} sources found`
                  : "Empty sources array"
              );
            } catch (e) {
              console.error(
                `getMessagesByThreadId - Error parsing sources JSON for message ${message.id}:`,
                e
              );
              console.error(
                "getMessagesByThreadId - Raw sources value:",
                message.sources
              );
            }
          } else {
            console.log(
              `getMessagesByThreadId - No sources for message ${message.id}`
            );
          }

          // Ensure reasoning is a string
          const reasoning = message.reasoning || "";

          return {
            ...message,
            sources,
            _reasoning: reasoning, // Add _reasoning field for client compatibility
          };
        });

        return processedMessages;
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
      return [];
    }
  }

  // Create a new message
  async createMessage(
    threadId: string,
    message: UIMessage & { sources?: SearchSource[]; reasoning?: string },
    sources?: SearchSource[]
  ) {
    try {
      const isAuth = await this.isAuthenticated();
      const userId = await this.getCurrentUserId();

      console.log("Creating message with auth status:", {
        isAuth,
        userId,
        threadId,
        messageId: message.id,
      });

      // Log the actual sources and reasoning being passed in
      console.log("createMessage - Input sources:", {
        fromMessage: message.sources ? message.sources.length : 0,
        fromParam: sources ? sources.length : 0,
        sourcesData: sources || message.sources || [],
      });
      console.log("createMessage - Input reasoning:", {
        hasReasoning: !!message.reasoning,
        reasoningLength: message.reasoning ? message.reasoning.length : 0,
      });

      if (isAuth && userId) {
        console.log("Saving message to Supabase:", {
          content: message.content,
          role: message.role,
        });

        // Prepare sources
        const messageSources = sources || message.sources || [];
        console.log("Sources to save:", {
          count: messageSources.length,
          sources: messageSources,
        });

        // Ensure sources are properly serializable
        const cleanSources = messageSources.map((source) => ({
          id: source.id || null,
          title: source.title || null,
          url: source.url,
          snippet: source.snippet || null,
        }));

        // Convert to JSON string
        let sourcesJson = null;
        try {
          sourcesJson =
            cleanSources.length > 0 ? JSON.stringify(cleanSources) : null;
          console.log(
            "Sources JSON prepared:",
            sourcesJson ? "JSON string of length " + sourcesJson.length : "null"
          );
        } catch (jsonError) {
          console.error("Error stringifying sources:", jsonError);
          // Fallback to empty array if JSON stringify fails
          sourcesJson = "[]";
        }

        // Prepare reasoning
        const safeReasoning = message.reasoning
          ? String(message.reasoning)
          : null;
        console.log("Reasoning to save:", {
          hasReasoning: !!safeReasoning,
          length: safeReasoning ? safeReasoning.length : 0,
          preview: safeReasoning
            ? safeReasoning.substring(0, 50) + "..."
            : "null",
        });

        // Create message in Supabase with sources and reasoning
        console.log("Inserting message with sources and reasoning:", {
          id: message.id,
          sourcesJson: sourcesJson ? "present" : "null",
          reasoning: safeReasoning ? "present" : "null",
        });

        const insertResult = await db.insert(messages).values({
          id: message.id,
          threadId,
          userId,
          content: message.content,
          role: message.role,
          createdAt: message.createdAt || new Date(),
          sources: sourcesJson,
          reasoning: safeReasoning,
        });

        console.log("Insert operation completed");

        // Verify the message was created with sources and reasoning
        const verifyResult = await db
          .select({
            id: messages.id,
            sources: messages.sources,
            reasoning: messages.reasoning,
          })
          .from(messages)
          .where(eq(messages.id, message.id));

        console.log("Verification query result:", {
          found: verifyResult.length > 0,
          hasSourcesField:
            verifyResult.length > 0 && verifyResult[0].sources !== undefined,
          sourcesValue:
            verifyResult.length > 0 ? verifyResult[0].sources : null,
          hasReasoningField:
            verifyResult.length > 0 && verifyResult[0].reasoning !== undefined,
          reasoningPreview:
            verifyResult.length > 0 && verifyResult[0].reasoning
              ? verifyResult[0].reasoning.substring(0, 50) + "..."
              : null,
        });

        // Update thread's last message timestamp
        await db
          .update(threads)
          .set({ lastMessageAt: message.createdAt || new Date() })
          .where(eq(threads.id, threadId));

        console.log("Message saved to Supabase successfully");
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
            reasoning: message.reasoning || "",
          });

          await db.threads.update(threadId, {
            lastMessageAt: message.createdAt || new Date(),
          });
        });

        console.log("Message saved locally successfully");
      }
    } catch (error) {
      console.error("Error creating message:", error);
    }
  }

  // Update message sources
  async updateMessageSources(messageId: string, sources: SearchSource[]) {
    try {
      const isAuth = await this.isAuthenticated();
      console.log("updateMessageSources - Auth status:", isAuth);
      console.log("updateMessageSources - Sources data:", {
        messageId,
        sourcesCount: sources ? sources.length : 0,
        sourcesData: sources,
      });

      if (isAuth) {
        // First check if the message exists
        const messageCheck = await db
          .select({ id: messages.id })
          .from(messages)
          .where(eq(messages.id, messageId));

        console.log("updateMessageSources - Message check:", {
          messageExists: messageCheck.length > 0,
          messageId,
        });

        if (messageCheck.length === 0) {
          console.log(
            "updateMessageSources - Message not found in database, cannot update sources"
          );
          return;
        }

        // Convert sources to JSON string - ensure it's a valid JSON string
        let sourcesJson = null;
        if (sources && sources.length > 0) {
          try {
            // Ensure the sources object is serializable
            const cleanSources = sources.map((source) => ({
              id: source.id || null,
              title: source.title || null,
              url: source.url,
              snippet: source.snippet || null,
            }));
            sourcesJson = JSON.stringify(cleanSources);
          } catch (jsonError) {
            console.error("Error stringifying sources:", jsonError);
            // Fallback to empty array if JSON stringify fails
            sourcesJson = "[]";
          }
        }

        console.log("updateMessageSources - Prepared JSON:", sourcesJson);

        // Update sources directly in the messages table
        await db
          .update(messages)
          .set({
            sources: sourcesJson,
          })
          .where(eq(messages.id, messageId));

        console.log("updateMessageSources - Update operation completed");

        // Verify the update
        const updatedMessage = await db
          .select({ sources: messages.sources })
          .from(messages)
          .where(eq(messages.id, messageId));

        console.log("updateMessageSources - Verification:", {
          messageFound: updatedMessage.length > 0,
          sourcesAfterUpdate:
            updatedMessage.length > 0 ? updatedMessage[0].sources : null,
        });
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { sources });
      }
    } catch (error) {
      console.error("Error updating message sources:", error);
    }
  }

  // Delete trailing messages
  async deleteTrailingMessages(
    threadId: string,
    createdAt: Date,
    gte: boolean = true
  ) {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Delete messages in Supabase
        if (gte) {
          await db
            .delete(messages)
            .where(
              and(
                eq(messages.threadId, threadId),
                eq(messages.createdAt, createdAt)
              )
            );
        } else {
          await db
            .delete(messages)
            .where(
              and(
                eq(messages.threadId, threadId),
                eq(messages.createdAt, new Date(createdAt.getTime() + 1))
              )
            );
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
    }
  }

  // Create message summary
  async createMessageSummary(
    threadId: string,
    messageId: string,
    content: string
  ) {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Create message summary in Supabase
        await db.insert(messageSummaries).values({
          id: uuidv4(),
          threadId,
          messageId,
          content,
          createdAt: new Date(),
        });
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
    }
  }

  // Get message summaries
  async getMessageSummaries(threadId: string) {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Get message summaries from Supabase
        return await db
          .select()
          .from(messageSummaries)
          .where(eq(messageSummaries.threadId, threadId))
          .orderBy(messageSummaries.createdAt);
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
      return [];
    }
  }

  // Update message reasoning
  async updateMessageReasoning(messageId: string, reasoning: string) {
    try {
      const isAuth = await this.isAuthenticated();
      console.log("updateMessageReasoning - Auth status:", isAuth);
      console.log("updateMessageReasoning - Reasoning data:", {
        messageId,
        reasoningLength: reasoning ? reasoning.length : 0,
        reasoningPreview: reasoning
          ? reasoning.substring(0, 50) + "..."
          : "null",
      });

      if (isAuth) {
        // First check if the message exists
        const messageCheck = await db
          .select({ id: messages.id })
          .from(messages)
          .where(eq(messages.id, messageId));

        console.log("updateMessageReasoning - Message check:", {
          messageExists: messageCheck.length > 0,
          messageId,
        });

        if (messageCheck.length === 0) {
          console.log(
            "updateMessageReasoning - Message not found in database, cannot update reasoning"
          );
          return;
        }

        // Ensure reasoning is a string
        const safeReasoning = reasoning ? String(reasoning) : "";

        // Update reasoning directly in the messages table
        await db
          .update(messages)
          .set({
            reasoning: safeReasoning,
          })
          .where(eq(messages.id, messageId));

        console.log("updateMessageReasoning - Update operation completed");

        // Verify the update
        const updatedMessage = await db
          .select({ reasoning: messages.reasoning })
          .from(messages)
          .where(eq(messages.id, messageId));

        console.log("updateMessageReasoning - Verification:", {
          messageFound: updatedMessage.length > 0,
          reasoningAfterUpdate:
            updatedMessage.length > 0 && updatedMessage[0].reasoning
              ? updatedMessage[0].reasoning.substring(0, 50) + "..."
              : null,
        });
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.messages.update(messageId, { reasoning });
      }
    } catch (error) {
      console.error("Error updating message reasoning:", error);
    }
  }

  // Migrate data from local storage to Supabase
  async migrateLocalDataToSupabase() {
    try {
      const isAuth = await this.isAuthenticated();
      const userId = await this.getCurrentUserId();

      if (!isAuth || !userId) {
        console.log("Cannot migrate data: User not authenticated");
        return;
      }

      console.log("Starting migration of local data to Supabase");

      // Import local DB
      const { db: localDb } = await import("../frontend/dexie/db");

      // Get all local threads
      const localThreads = await localDb.threads.toArray();
      console.log(`Found ${localThreads.length} local threads to migrate`);

      // For each thread, migrate it and its messages
      for (const thread of localThreads) {
        console.log(`Migrating thread: ${thread.id} - ${thread.title}`);

        // Check if thread already exists in Supabase
        const existingThreads = await db
          .select()
          .from(threads)
          .where(eq(threads.id, thread.id));

        if (existingThreads.length === 0) {
          // Create thread in Supabase
          await db.insert(threads).values({
            id: thread.id,
            title: thread.title,
            userId,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            lastMessageAt: thread.lastMessageAt,
          });

          // Get all messages for this thread
          const localMessages = await localDb.messages
            .where("threadId")
            .equals(thread.id)
            .toArray();

          console.log(
            `Migrating ${localMessages.length} messages for thread ${thread.id}`
          );

          // Migrate each message
          for (const message of localMessages) {
            // Check if message already exists
            const existingMessages = await db
              .select()
              .from(messages)
              .where(eq(messages.id, message.id));

            if (existingMessages.length === 0) {
              // Insert message
              await db.insert(messages).values({
                id: message.id,
                threadId: message.threadId,
                userId,
                content: message.content,
                role: message.role,
                createdAt: message.createdAt,
              });

              // Migrate sources if any
              if (message.sources && message.sources.length > 0) {
                const messageSourcesToAdd = message.sources.map((source) => ({
                  id: uuidv4(),
                  messageId: message.id,
                  title: source.title || null,
                  url: source.url,
                  snippet: source.snippet || null,
                  createdAt: new Date(),
                }));

                await db.insert(messageSources).values(messageSourcesToAdd);
              }
            }
          }

          // Migrate message summaries
          const localSummaries = await localDb.messageSummaries
            .where("threadId")
            .equals(thread.id)
            .toArray();

          console.log(
            `Migrating ${localSummaries.length} summaries for thread ${thread.id}`
          );

          for (const summary of localSummaries) {
            await db.insert(messageSummaries).values({
              id: summary.id,
              threadId: summary.threadId,
              messageId: summary.messageId,
              content: summary.content,
              createdAt: summary.createdAt,
            });
          }
        } else {
          console.log(
            `Thread ${thread.id} already exists in Supabase, skipping`
          );
        }
      }

      console.log("Migration completed successfully");
      return true;
    } catch (error) {
      console.error("Error migrating local data to Supabase:", error);
      return false;
    }
  }
}

// Export singleton instance
export const dataService = new DataService();
