-- Create news cache tables for automated daily updates
CREATE TABLE public.news_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL, -- 'discogs' or 'perplexity'
  content JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

-- Create policies - news cache is public readable
CREATE POLICY "News cache is viewable by everyone" 
ON public.news_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Allow system to manage news cache" 
ON public.news_cache 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_news_cache_source ON public.news_cache(source);
CREATE INDEX idx_news_cache_expires_at ON public.news_cache(expires_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_cache_updated_at
BEFORE UPDATE ON public.news_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();