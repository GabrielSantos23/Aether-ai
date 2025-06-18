CREATE TABLE "thread_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid,
	"parent_thread_id" uuid,
	"branched_from_message_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thread_branches" ADD CONSTRAINT "thread_branches_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_branches" ADD CONSTRAINT "thread_branches_parent_thread_id_threads_id_fk" FOREIGN KEY ("parent_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_branches" ADD CONSTRAINT "thread_branches_branched_from_message_id_messages_id_fk" FOREIGN KEY ("branched_from_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "is_branch";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "parent_thread_id";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "branched_from_message_id";