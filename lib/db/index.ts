import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Disable prepared statements for Supabase connection pooler
const client = postgres(process.env.DATABASE_URL || "", { prepare: false });
export const db = drizzle({ client, schema });

// Export types
export type Thread = typeof schema.threads.$inferSelect;
export type InsertThread = typeof schema.threads.$inferInsert;

export type Message = typeof schema.messages.$inferSelect;
export type InsertMessage = typeof schema.messages.$inferInsert;

export type MessageSource = typeof schema.messageSources.$inferSelect;
export type InsertMessageSource = typeof schema.messageSources.$inferInsert;

export type MessageSummary = typeof schema.messageSummaries.$inferSelect;
export type InsertMessageSummary = typeof schema.messageSummaries.$inferInsert;
