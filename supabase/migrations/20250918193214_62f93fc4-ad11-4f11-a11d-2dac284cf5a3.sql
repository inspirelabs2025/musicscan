-- Create blog reviews table for user ratings and reviews
CREATE TABLE public.blog_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_content TEXT,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blog_post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blog_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for blog reviews
CREATE POLICY "Users can create their own blog reviews" 
ON public.blog_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog reviews" 
ON public.blog_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all published blog reviews" 
ON public.blog_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own blog reviews" 
ON public.blog_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create blog comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_comment_id UUID,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for blog comments
CREATE POLICY "Users can create their own blog comments" 
ON public.blog_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog comments" 
ON public.blog_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all blog comments" 
ON public.blog_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own blog comments" 
ON public.blog_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create blog context table for historical context
CREATE TABLE public.blog_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL UNIQUE,
  historical_events JSONB,
  music_scene_context JSONB,
  cultural_context JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cached_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  ai_model TEXT DEFAULT 'perplexity-api',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_context ENABLE ROW LEVEL SECURITY;

-- Create policies for blog context
CREATE POLICY "Blog context is viewable by everyone" 
ON public.blog_context 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create blog context" 
ON public.blog_context 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update blog context" 
ON public.blog_context 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create comment votes table for tracking user votes
CREATE TABLE public.blog_comment_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blog_comment_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for comment votes
CREATE POLICY "Users can create their own comment votes" 
ON public.blog_comment_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment votes" 
ON public.blog_comment_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comment votes" 
ON public.blog_comment_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own comment votes" 
ON public.blog_comment_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers to update updated_at columns
CREATE TRIGGER update_blog_reviews_updated_at
  BEFORE UPDATE ON public.blog_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_context_updated_at
  BEFORE UPDATE ON public.blog_context
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_blog_reviews_blog_post_id ON public.blog_reviews(blog_post_id);
CREATE INDEX idx_blog_reviews_user_id ON public.blog_reviews(user_id);
CREATE INDEX idx_blog_reviews_rating ON public.blog_reviews(rating);

CREATE INDEX idx_blog_comments_blog_post_id ON public.blog_comments(blog_post_id);
CREATE INDEX idx_blog_comments_user_id ON public.blog_comments(user_id);
CREATE INDEX idx_blog_comments_parent_comment_id ON public.blog_comments(parent_comment_id);

CREATE INDEX idx_blog_context_blog_post_id ON public.blog_context(blog_post_id);

CREATE INDEX idx_blog_comment_votes_comment_id ON public.blog_comment_votes(comment_id);
CREATE INDEX idx_blog_comment_votes_user_id ON public.blog_comment_votes(user_id);