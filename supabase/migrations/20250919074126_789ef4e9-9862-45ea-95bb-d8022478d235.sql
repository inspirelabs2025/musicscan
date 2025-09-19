-- Create table for news blog posts
CREATE TABLE public.news_blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Full markdown content
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL,
  author TEXT DEFAULT 'Muzieknieuws AI' NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies - blog posts are public readable
CREATE POLICY "News blog posts are viewable by everyone" 
ON public.news_blog_posts 
FOR SELECT 
USING (true);

-- Allow system to manage blog posts
CREATE POLICY "System can manage news blog posts" 
ON public.news_blog_posts 
FOR ALL
USING (true);

-- Create index for better performance
CREATE INDEX idx_news_blog_posts_slug ON public.news_blog_posts(slug);
CREATE INDEX idx_news_blog_posts_published_at ON public.news_blog_posts(published_at DESC);
CREATE INDEX idx_news_blog_posts_category ON public.news_blog_posts(category);

-- Add trigger for updating timestamps
CREATE TRIGGER update_news_blog_posts_updated_at
BEFORE UPDATE ON public.news_blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();