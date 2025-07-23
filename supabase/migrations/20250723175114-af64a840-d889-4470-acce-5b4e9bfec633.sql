-- Add user_id column to chat_messages table for user-specific filtering
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for better query performance with user_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_session ON public.chat_messages(user_id, session_id);

-- Update RLS policies to be user-specific
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.chat_messages;

-- Create user-specific policies
CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
ON public.chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);