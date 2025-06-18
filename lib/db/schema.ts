import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { relations } from "drizzle-orm";

// Thread table schema
export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  isPublic: boolean("is_public").default(false),
  isBranch: boolean("is_branch").default(false), // Flag to indicate if this thread is a branch
});

// Shared threads table schema for specific user access
export const sharedThreads = pgTable("shared_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").references(() => threads.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Message table schema
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").references(() => threads.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sources: text("sources"), // JSON string for sources
  reasoning: text("reasoning"), // Store reasoning directly in the message
});

// Message sources table schema
export const messageSources = pgTable("message_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "cascade",
  }),
  title: text("title"),
  url: text("url").notNull(),
  snippet: text("snippet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Message summaries table schema
export const messageSummaries = pgTable("message_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").references(() => threads.id, {
    onDelete: "cascade",
  }),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Message reasoning table schema
export const messageReasonings = pgTable("message_reasonings", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define relations
export const threadsRelations = relations(threads, ({ many }) => ({
  messages: many(messages),
  messageSummaries: many(messageSummaries),
  sharedWith: many(sharedThreads),
}));

export const sharedThreadsRelations = relations(sharedThreads, ({ one }) => ({
  thread: one(threads, {
    fields: [sharedThreads.threadId],
    references: [threads.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
  sources: many(messageSources),
  summaries: many(messageSummaries),
  reasonings: many(messageReasonings),
}));

export const messageSourcesRelations = relations(messageSources, ({ one }) => ({
  message: one(messages, {
    fields: [messageSources.messageId],
    references: [messages.id],
  }),
}));

export const messageSummariesRelations = relations(
  messageSummaries,
  ({ one }) => ({
    thread: one(threads, {
      fields: [messageSummaries.threadId],
      references: [threads.id],
    }),
    message: one(messages, {
      fields: [messageSummaries.messageId],
      references: [messages.id],
    }),
  })
);

export const messageReasoningsRelations = relations(
  messageReasonings,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageReasonings.messageId],
      references: [messages.id],
    }),
  })
);
