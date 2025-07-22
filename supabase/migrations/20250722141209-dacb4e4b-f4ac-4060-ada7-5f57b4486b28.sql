
-- Create table for chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Message content
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  
  -- Collection context when message was sent
  collection_context JSONB,
  
  -- AI metadata
  ai_model TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  
  -- Message formatting
  format_type TEXT DEFAULT 'text' CHECK (format_type IN ('text', 'markdown', 'rich')),
  
  -- Session grouping
  session_id UUID DEFAULT gen_random_uuid()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (matching existing pattern)
CREATE POLICY "Allow anonymous read access" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous insert access" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" 
ON public.chat_messages 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
