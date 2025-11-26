-- Create news_rss_feeds table for RSS feed management
CREATE TABLE IF NOT EXISTS public.news_rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_url TEXT NOT NULL UNIQUE,
  feed_name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  articles_fetched_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_rss_feeds ENABLE ROW LEVEL SECURITY;

-- Admin can manage feeds
CREATE POLICY "Admins can manage RSS feeds"
  ON public.news_rss_feeds
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create index for active feeds
CREATE INDEX idx_news_rss_feeds_active ON public.news_rss_feeds(is_active, last_fetched_at);

-- Create trigger for updated_at
CREATE TRIGGER update_news_rss_feeds_updated_at
  BEFORE UPDATE ON public.news_rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default Dutch music RSS feeds
INSERT INTO public.news_rss_feeds (feed_url, feed_name, category) VALUES
  ('https://www.3voor12.nl/rss', '3voor12', 'Alternative'),
  ('https://www.nporadio2.nl/rss/soul-en-jazz', 'NPO Radio 2 Soul & Jazz', 'Jazz'),
  ('https://www.heaven.nl/feed/', 'Heaven Magazine', 'Dance')
ON CONFLICT (feed_url) DO NOTHING;