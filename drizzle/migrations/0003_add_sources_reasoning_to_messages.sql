-- Add sources and reasoning columns to the messages table
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sources" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "reasoning" TEXT; 