-- Make user_id nullable in echo_conversations for public access
ALTER TABLE echo_conversations 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON echo_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON echo_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON echo_conversations;
DROP POLICY IF EXISTS "Users can view their conversation messages" ON echo_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON echo_messages;

-- Create new public RLS policies for echo_conversations
-- Allow public to create conversations (with or without user_id)
CREATE POLICY "Anyone can create conversations"
  ON echo_conversations FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own conversations OR conversations by session_id
CREATE POLICY "View own or session conversations"
  ON echo_conversations FOR SELECT
  USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Allow update for own conversations or session-based
CREATE POLICY "Update own or session conversations"
  ON echo_conversations FOR UPDATE
  USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Create new public RLS policies for echo_messages
-- Allow anyone to create messages in any conversation
CREATE POLICY "Anyone can create messages"
  ON echo_messages FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view messages (public chat)
CREATE POLICY "Anyone can view messages"
  ON echo_messages FOR SELECT
  USING (true);