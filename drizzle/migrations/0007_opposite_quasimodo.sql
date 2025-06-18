ALTER TABLE "organizations" DROP CONSTRAINT "organizations_slug_unique";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "shared_threads" DROP CONSTRAINT "shared_threads_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "threads" DROP CONSTRAINT "threads_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "thread_shares" ALTER COLUMN "thread_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ip" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "last_active" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "thread_shares" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "ip_address";--> statement-breakpoint
ALTER TABLE "thread_shares" ADD CONSTRAINT "thread_shares_token_unique" UNIQUE("token");