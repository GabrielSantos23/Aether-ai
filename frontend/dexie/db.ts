import { UIMessage } from "ai";
import Dexie, { type EntityTable } from "dexie";

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

// Define a type for search sources
export interface SearchSource {
  id?: string;
  title?: string;
  url: string;
  snippet?: string;
}

interface DBMessage {
  id: string;
  threadId: string;
  parts: UIMessage["parts"];
  content: string;
  role: "user" | "assistant" | "system" | "data";
  createdAt: Date;
  sources?: SearchSource[]; // Add sources to the message schema
  reasoning?: string; // Add reasoning to the message schema
}

interface MessageSummary {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: Date;
}

const db = new Dexie("aether-ai") as Dexie & {
  threads: EntityTable<Thread, "id">;
  messages: EntityTable<DBMessage, "id">;
  messageSummaries: EntityTable<MessageSummary, "id">;
};

// Update the database version to include sources and reasoning
db.version(3).stores({
  threads: "id, title, updatedAt, lastMessageAt",
  messages: "id, threadId, createdAt, [threadId+createdAt]",
  messageSummaries: "id, threadId, messageId, createdAt, [threadId+createdAt]",
});

export type { Thread, DBMessage };
export { db };
