ALTER TABLE "account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization_invitations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "thread_shares" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "account" CASCADE;--> statement-breakpoint
DROP TABLE "organization_invitations" CASCADE;--> statement-breakpoint
DROP TABLE "organization_members" CASCADE;--> statement-breakpoint
DROP TABLE "organizations" CASCADE;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP TABLE "thread_shares" CASCADE;--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
DROP TABLE "verification" CASCADE;--> statement-breakpoint
ALTER TABLE "threads" DROP CONSTRAINT "threads_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "threads" ALTER COLUMN "is_public" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "is_branch" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "parent_thread_id" uuid;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "branched_from_message_id" uuid;--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "organization_id";