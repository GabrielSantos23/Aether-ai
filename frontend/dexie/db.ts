import { UIMessage } from "ai";
import Dexie, { type EntityTable } from "dexie";

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  isBranch?: boolean;
}

interface ThreadBranch {
  id: string;
  threadId: string;
  parentThreadId: string;
  branchedFromMessageId: string;
  createdAt: Date;
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
  threadBranches: EntityTable<ThreadBranch, "id">;
  messages: EntityTable<DBMessage, "id">;
  messageSummaries: EntityTable<MessageSummary, "id">;
};

// Update the database version to include thread branches
db.version(4).stores({
  threads: "id, title, updatedAt, lastMessageAt",
  threadBranches:
    "id, threadId, parentThreadId, createdAt, [threadId+createdAt]",
  messages: "id, threadId, createdAt, [threadId+createdAt]",
  messageSummaries: "id, threadId, messageId, createdAt, [threadId+createdAt]",
});

export type { Thread, ThreadBranch, DBMessage };
export { db };
