-- Add is_branch column to threads table
ALTER TABLE "threads" ADD COLUMN IF NOT EXISTS "is_branch" boolean DEFAULT false; 