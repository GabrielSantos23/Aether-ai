import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "./db";
import { authClient } from "./auth-client";
import { toast } from "sonner";

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

      if (isAuth && userId) {
        // Get threads from Supabase
        const { data: result, error } = await supabase
          .from("threads")
          .select("*")
          .eq("user_id", userId)
          .order("last_message_at", { ascending: true });

        if (error) throw error;
        return result.reverse();
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        const localThreads = await db.threads
          .orderBy("lastMessageAt")
          .reverse()
          .toArray();
        return localThreads;
      }
    } catch (error) {
      console.error("Error getting threads:", error);
      return [];
    }
  }

  // Create a new thread
  async createThread(
    id: string,
    title: string = "New Chat",
    isBranch: boolean = false
  ) {
    try {
      const isAuth = await this.isAuthenticated();
      const userId = await this.getCurrentUserId();

      if (isAuth && userId) {
        // Create thread in Supabase
        const { error } = await supabase.from("threads").insert({
          id,
          title,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          is_branch: isBranch,
        });

        if (error) throw error;
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.threads.add({
          id,
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageAt: new Date(),
          isBranch,
        });
      }
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  }

  // Update thread title
  async updateThread(
    id: string,
    options: { title?: string; isBranch?: boolean }
  ) {
    try {
      const isAuth = await this.isAuthenticated();
      const { title, isBranch } = options;

      if (isAuth) {
        // Update thread in Supabase
        const updateData: any = { updated_at: new Date().toISOString() };
        if (title) updateData.title = title;
        if (isBranch !== undefined) updateData.is_branch = isBranch;

        const { error } = await supabase
          .from("threads")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;
      } else {
        // Use IndexedDB via Dexie for local storage
        const { db } = await import("../frontend/dexie/db");
        await db.threads.update(id, {
          ...(title && { title }),
          ...(isBranch !== undefined && { isBranch }),
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
        const { error } = await supabase.from("threads").delete().eq("id", id);

        if (error) throw error;
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
        const { error } = await supabase
          .from("threads")
          .delete()
          .eq("user_id", userId);

        if (error) throw error;
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

      if (isAuth) {
        // Get messages from Supabase
        const { data: result, error } = await supabase
          .from("messages")
          .select("*")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Process messages to ensure proper format
        const processedMessages = result.map((message) => {
          // Parse sources JSON if it exists
          let sources = [];
          if (message.sources) {
            try {
              sources = JSON.parse(message.sources);
            } catch (e) {
              console.error(
                `getMessagesByThreadId - Error parsing sources JSON for message ${message.id}:`,
                e
              );
            }
          } else {
            toast.error(
              `getMessagesByThreadId - No sources for message ${message.id}`
            );
          }

          // Ensure reasoning is a string
          const reasoning = message.reasoning || "";

          return {
            ...message,
            threadId: message.thread_id,
            userId: message.user_id,
            createdAt: new Date(message.created_at),
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

      if (isAuth && userId) {
        // Prepare sources
        const messageSources = sources || message.sources || [];

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
        } catch (jsonError) {
          console.error("Error stringifying sources:", jsonError);
          // Fallback to empty array if JSON stringify fails
          sourcesJson = "[]";
        }

        // Prepare reasoning
        const safeReasoning = message.reasoning
          ? String(message.reasoning)
          : null;

        // Create message in Supabase with sources and reasoning
        const { error: insertError } = await supabase.from("messages").insert({
          id: message.id,
          thread_id: threadId,
          user_id: userId,
          content: message.content,
          role: message.role,
          created_at:
            message.createdAt?.toISOString() || new Date().toISOString(),
          sources: sourcesJson,
          reasoning: safeReasoning,
        });

        if (insertError) throw insertError;

        // Verify the message was created with sources and reasoning
        const { data: verifyData, error: verifyError } = await supabase
          .from("messages")
          .select("id, sources, reasoning")
          .eq("id", message.id)
          .single();

        if (verifyError) console.error("Verification error:", verifyError);

        // Update thread's last message timestamp
        const { error: updateError } = await supabase
          .from("threads")
          .update({
            last_message_at:
              message.createdAt?.toISOString() || new Date().toISOString(),
          })
          .eq("id", threadId);

        if (updateError) throw updateError;
      } else {
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
      }
    } catch (error) {
      console.error("Error creating message:", error);
    }
  }

  // Update message sources
  async updateMessageSources(messageId: string, sources: SearchSource[]) {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // First check if the message exists
        const { data: messageCheck, error: checkError } = await supabase
          .from("messages")
          .select("id")
          .eq("id", messageId)
          .single();

        if (checkError) {
          toast.error(
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

        // Update sources directly in the messages table
        const { error: updateError } = await supabase
          .from("messages")
          .update({ sources: sourcesJson })
          .eq("id", messageId);

        if (updateError) throw updateError;

        // Verify the update
        const { error: verifyError } = await supabase
          .from("messages")
          .select("sources")
          .eq("id", messageId)
          .single();

        if (verifyError) console.error("Verification error:", verifyError);
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
        const createdAtIso = createdAt.toISOString();
        let query = supabase
          .from("messages")
          .delete()
          .eq("thread_id", threadId);

        if (gte) {
          query = query.gte("created_at", createdAtIso);
        } else {
          const nextTimestamp = new Date(createdAt.getTime() + 1).toISOString();
          query = query.gte("created_at", nextTimestamp);
        }

        const { error } = await query;
        if (error) throw error;
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
        const { error } = await supabase.from("message_summaries").insert({
          id: uuidv4(),
          thread_id: threadId,
          message_id: messageId,
          content,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
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
        const { data, error } = await supabase
          .from("message_summaries")
          .select("*")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Transform to camelCase
        return data.map((summary) => ({
          ...summary,
          threadId: summary.thread_id,
          messageId: summary.message_id,
          createdAt: new Date(summary.created_at),
        }));
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

      if (isAuth) {
        // First check if the message exists
        const { data: messageCheck, error: checkError } = await supabase
          .from("messages")
          .select("id")
          .eq("id", messageId)
          .single();

        if (checkError) {
          toast.error(
            "updateMessageReasoning - Message not found in database, cannot update reasoning"
          );
          return;
        }

        // Ensure reasoning is a string
        const safeReasoning = reasoning ? String(reasoning) : "";

        // Update reasoning directly in the messages table
        const { error: updateError } = await supabase
          .from("messages")
          .update({ reasoning: safeReasoning })
          .eq("id", messageId);

        if (updateError) throw updateError;

        // Verify the update
        const { error: verifyError } = await supabase
          .from("messages")
          .select("reasoning")
          .eq("id", messageId)
          .single();

        if (verifyError) console.error("Verification error:", verifyError);
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
      console.log("Starting migration of local data to Supabase");

      const isAuth = await this.isAuthenticated();
      const userId = await this.getCurrentUserId();

      console.log("Authentication check:", { isAuth, userId });

      if (!isAuth || !userId) {
        console.log("Cannot migrate data: User not authenticated");
        return false;
      }

      // Import local DB
      const { db: localDb } = await import("../frontend/dexie/db");

      // Get all local threads
      const localThreads = await localDb.threads.toArray();
      console.log(`Found ${localThreads.length} local threads to migrate`);

      if (localThreads.length === 0) {
        console.log("No local threads to migrate");
        return true; // Nothing to migrate is still a success
      }

      // For each thread, migrate it and its messages
      for (const thread of localThreads) {
        console.log(`Processing thread: ${thread.id} - ${thread.title}`);

        // Check if thread already exists in Supabase
        const { data: existingThreads, error: threadCheckError } =
          await supabase.from("threads").select("id").eq("id", thread.id);

        if (threadCheckError) throw threadCheckError;

        if (!existingThreads?.length) {
          console.log(
            `Thread ${thread.id} does not exist in Supabase, creating it`
          );

          // Create thread in Supabase
          const { error: insertThreadError } = await supabase
            .from("threads")
            .insert({
              id: thread.id,
              title: thread.title,
              user_id: userId,
              created_at: thread.createdAt?.toISOString(),
              updated_at: thread.updatedAt?.toISOString(),
              last_message_at: thread.lastMessageAt?.toISOString(),
              is_branch: thread.isBranch || false,
            });

          if (insertThreadError) throw insertThreadError;

          // Get all messages for this thread
          const localMessages = await localDb.messages
            .where("threadId")
            .equals(thread.id)
            .toArray();

          console.log(
            `Found ${localMessages.length} messages for thread ${thread.id}`
          );

          // Migrate each message
          for (const message of localMessages) {
            console.log(`Processing message: ${message.id}`);

            // Check if message already exists
            const { data: existingMessages, error: messageCheckError } =
              await supabase.from("messages").select("id").eq("id", message.id);

            if (messageCheckError) throw messageCheckError;

            if (!existingMessages?.length) {
              console.log(
                `Message ${message.id} does not exist in Supabase, creating it`
              );

              // Prepare sources
              let sourcesJson = null;
              if (message.sources && message.sources.length > 0) {
                try {
                  console.log(
                    `Message ${message.id} has ${message.sources.length} sources`
                  );
                  sourcesJson = JSON.stringify(message.sources);
                } catch (e) {
                  console.error(
                    `Error stringifying sources for message ${message.id}:`,
                    e
                  );
                  sourcesJson = "[]";
                }
              }

              // Insert message
              const { error: insertMessageError } = await supabase
                .from("messages")
                .insert({
                  id: message.id,
                  thread_id: message.threadId,
                  user_id: userId,
                  content: message.content,
                  role: message.role,
                  created_at: message.createdAt?.toISOString(),
                  sources: sourcesJson,
                  reasoning: message.reasoning || null,
                });

              if (insertMessageError) throw insertMessageError;
              console.log(`Message ${message.id} created successfully`);
            } else {
              console.log(
                `Message ${message.id} already exists in Supabase, skipping`
              );
            }
          }

          // Migrate message summaries
          const localSummaries = await localDb.messageSummaries
            .where("threadId")
            .equals(thread.id)
            .toArray();

          console.log(
            `Found ${localSummaries.length} summaries for thread ${thread.id}`
          );

          for (const summary of localSummaries) {
            console.log(`Processing summary: ${summary.id}`);

            // Check if summary already exists
            const { data: existingSummaries, error: summaryCheckError } =
              await supabase
                .from("message_summaries")
                .select("id")
                .eq("id", summary.id);

            if (summaryCheckError) throw summaryCheckError;

            if (!existingSummaries?.length) {
              const { error: insertSummaryError } = await supabase
                .from("message_summaries")
                .insert({
                  id: summary.id,
                  thread_id: summary.threadId,
                  message_id: summary.messageId,
                  content: summary.content,
                  created_at: summary.createdAt?.toISOString(),
                });

              if (insertSummaryError) throw insertSummaryError;
              console.log(`Summary ${summary.id} created successfully`);
            } else {
              console.log(
                `Summary ${summary.id} already exists in Supabase, skipping`
              );
            }
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
      console.error("Error migrating data:", error);
      return false;
    }
  }
}

// Export singleton instance
export const dataService = new DataService();
