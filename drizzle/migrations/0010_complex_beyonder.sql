DROP TABLE "thread_branches" CASCADE;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "is_branch" boolean DEFAULT false;