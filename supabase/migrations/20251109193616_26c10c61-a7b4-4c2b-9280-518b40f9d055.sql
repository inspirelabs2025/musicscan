-- Create echo_conversations table
CREATE TABLE echo_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  conversation_type text CHECK (conversation_type IN ('album_story', 'lyric_analysis', 'memory', 'general')),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create echo_messages table
CREATE TABLE echo_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES echo_conversations(id) ON DELETE CASCADE,
  message text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'echo')),
  created_at timestamptz DEFAULT now(),
  message_type text,
  tokens_used integer,
  response_time_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create echo_user_preferences table
CREATE TABLE echo_user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_preference text DEFAULT 'balanced' CHECK (tone_preference IN ('warm', 'balanced', 'poetic')),
  language text DEFAULT 'nl',
  favorite_genres text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_echo_conversations_user ON echo_conversations(user_id);
CREATE INDEX idx_echo_conversations_session ON echo_conversations(session_id);
CREATE INDEX idx_echo_messages_conversation ON echo_messages(conversation_id);
CREATE INDEX idx_echo_messages_created ON echo_messages(created_at DESC);

-- RLS Policies
ALTER TABLE echo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE echo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE echo_user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
  ON echo_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON echo_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON echo_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only see messages from their conversations
CREATE POLICY "Users can view their conversation messages"
  ON echo_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM echo_conversations
      WHERE echo_conversations.id = echo_messages.conversation_id
      AND echo_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON echo_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM echo_conversations
      WHERE echo_conversations.id = echo_messages.conversation_id
      AND echo_conversations.user_id = auth.uid()
    )
  );

-- Users can manage their own preferences
CREATE POLICY "Users can view their own preferences"
  ON echo_user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON echo_user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON echo_user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_echo_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_echo_preferences_updated_at
  BEFORE UPDATE ON echo_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_echo_preferences_updated_at();