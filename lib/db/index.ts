import { createClient } from "@supabase/supabase-js";

// Create a Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Export table types for TypeScript support
export type Thread = {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  isPublic?: boolean;
  isBranch?: boolean;
};

export type Message = {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  role: string;
  createdAt: Date;
  sources?: string | null;
  reasoning?: string | null;
};

export type MessageSource = {
  id: string;
  messageId: string;
  title?: string;
  url: string;
  snippet?: string;
  createdAt: Date;
};

export type MessageSummary = {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: Date;
};
