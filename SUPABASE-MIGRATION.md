# Migration from Drizzle ORM to Supabase

This document outlines the migration from using Drizzle ORM to directly using the Supabase JavaScript client for database operations in the Aether AI project.

## Key Changes

1. **Database Client**:

   - Replaced Drizzle ORM with the Supabase JavaScript client
   - Updated field names from camelCase to snake_case (e.g., `userId` → `user_id`)
   - Added proper error handling for Supabase operations

2. **Authentication**:

   - Simplified the authentication approach to use the direct DATABASE_URL for better-auth
   - Added a separate Supabase client export for auth-related operations

3. **API Routes**:
   - Updated all API routes to use Supabase queries instead of Drizzle queries
   - Modified response processing to transform snake_case back to camelCase for frontend compatibility

## Database Schema

The database schema remains the same, but field names in queries use snake_case:

- `userId` → `user_id`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `lastMessageAt` → `last_message_at`
- `threadId` → `thread_id`
- `messageId` → `message_id`
- `isBranch` → `is_branch`
- `isPublic` → `is_public`

## Environment Variables

The application now uses:

- `NEXT_PUBLIC_SUPABASE_URL` - The URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - The anonymous key for your Supabase project
- `DATABASE_URL` - The PostgreSQL connection string (still required for better-auth)

## Code Examples

### Before (Drizzle ORM)

```typescript
import { db } from "./db";
import { eq } from "drizzle-orm";
import { threads } from "./db/schema";

// Query example
const result = await db
  .select()
  .from(threads)
  .where(eq(threads.userId, userId))
  .orderBy(threads.lastMessageAt);

// Insert example
await db.insert(threads).values({
  id,
  title,
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastMessageAt: new Date(),
});
```

### After (Supabase Client)

```typescript
import { supabase } from "./db";

// Query example
const { data: result, error } = await supabase
  .from("threads")
  .select("*")
  .eq("user_id", userId)
  .order("last_message_at", { ascending: true });

// Insert example
const { error } = await supabase.from("threads").insert({
  id,
  title,
  user_id: userId,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_message_at: new Date().toISOString(),
});
```

## Error Handling

All Supabase operations now include proper error handling:

```typescript
const { data, error } = await supabase.from("table").select("*");
if (error) throw error;
```

## Date Handling

When working with dates:

- Dates are stored as ISO strings in Supabase (`new Date().toISOString()`)
- Dates from Supabase are parsed back to Date objects when needed (`new Date(dateString)`)
