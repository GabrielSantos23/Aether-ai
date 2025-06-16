-- Alter the threads table to change user_id from UUID to TEXT
ALTER TABLE threads
ALTER COLUMN user_id TYPE TEXT;

-- Alter the messages table to change user_id from UUID to TEXT
ALTER TABLE messages
ALTER COLUMN user_id TYPE TEXT;

-- Drop any foreign key constraints that might exist
ALTER TABLE threads
DROP CONSTRAINT IF EXISTS threads_user_id_fkey;

ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_user_id_fkey; 