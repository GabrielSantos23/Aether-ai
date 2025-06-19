import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL || "";

// Check if we're using an IPv6 address (enclosed in brackets)
const isIpv6 = databaseUrl.includes("[") && databaseUrl.includes("]");

// Configure connection options
const connectionOptions = {
  prepare: false,
  connect_timeout: 60, // Increase timeout
  ssl: { rejectUnauthorized: false },
  // Don't set family option for IPv6 addresses
  ...(isIpv6 ? {} : { socket: { family: 4 } }),
};

// Create the database client
const client = postgres(databaseUrl, connectionOptions);
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
