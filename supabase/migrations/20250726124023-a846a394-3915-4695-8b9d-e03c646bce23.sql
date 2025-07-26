-- Create album_insights table for better caching and organization
CREATE TABLE public.album_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL,
  album_type TEXT NOT NULL CHECK (album_type IN ('cd', 'vinyl')),
  user_id UUID NOT NULL,
  insights_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_model TEXT NOT NULL DEFAULT 'gpt-4.1-2025-04-14',
  cached_until TIMESTAMP WITH TIME ZONE,
  generation_time_ms INTEGER,
  
  -- Ensure unique insights per album
  UNIQUE(album_id, album_type)
);

-- Enable RLS
ALTER TABLE public.album_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own album insights" 
ON public.album_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own album insights" 
ON public.album_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own album insights" 
ON public.album_insights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own album insights" 
ON public.album_insights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_album_insights_album_id ON public.album_insights(album_id);
CREATE INDEX idx_album_insights_user_id ON public.album_insights(user_id);
CREATE INDEX idx_album_insights_cached_until ON public.album_insights(cached_until);

-- Add trigger for updated_at
CREATE TRIGGER update_album_insights_updated_at
BEFORE UPDATE ON public.album_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();