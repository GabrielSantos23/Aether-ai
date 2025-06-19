import { createClient } from "@supabase/supabase-js";

// Determine which key to use - prefer service role key for server-side operations
const supabaseKey =
  typeof window === "undefined"
    ? process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey,
  {
    auth: {
      persistSession: false, // Don't persist the session in localStorage
      autoRefreshToken: true, // Automatically refresh the token
      detectSessionInUrl: false, // Don't detect the session in the URL
    },
    db: {
      schema: "public", // Use the public schema
    },
    global: {
      headers: {
        // Add any required headers here
      },
    },
  }
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
