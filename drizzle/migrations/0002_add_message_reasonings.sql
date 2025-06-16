-- Create the message_reasonings table
CREATE TABLE IF NOT EXISTS "message_reasonings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "message_id" uuid REFERENCES "messages"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
); 