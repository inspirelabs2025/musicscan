-- Create forum topics table
CREATE TABLE public.forum_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  topic_type TEXT NOT NULL DEFAULT 'user_created' CHECK (topic_type IN ('user_created', 'auto_generated')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  artist_name TEXT,
  album_title TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false
);

-- Create forum posts table
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum post votes table
CREATE TABLE public.forum_post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create forum topic subscriptions table
CREATE TABLE public.forum_topic_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topic_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_topics
CREATE POLICY "Forum topics are viewable by everyone" 
ON public.forum_topics 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own topics" 
ON public.forum_topics 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own topics" 
ON public.forum_topics 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for forum_posts
CREATE POLICY "Forum posts are viewable by everyone" 
ON public.forum_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create forum posts" 
ON public.forum_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.forum_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.forum_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for forum_post_votes
CREATE POLICY "Forum post votes are viewable by everyone" 
ON public.forum_post_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.forum_post_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.forum_post_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.forum_post_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for forum_topic_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.forum_topic_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.forum_topic_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
ON public.forum_topic_subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_forum_topics_created_by ON public.forum_topics(created_by);
CREATE INDEX idx_forum_topics_created_at ON public.forum_topics(created_at DESC);
CREATE INDEX idx_forum_topics_featured ON public.forum_topics(is_featured, created_at DESC);
CREATE INDEX idx_forum_posts_topic_id ON public.forum_posts(topic_id);
CREATE INDEX idx_forum_posts_user_id ON public.forum_posts(user_id);
CREATE INDEX idx_forum_posts_parent_post_id ON public.forum_posts(parent_post_id);
CREATE INDEX idx_forum_post_votes_post_id ON public.forum_post_votes(post_id);
CREATE INDEX idx_forum_topic_subscriptions_user_id ON public.forum_topic_subscriptions(user_id);

-- Triggers for updating reply counts
CREATE OR REPLACE FUNCTION public.update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_topics 
    SET reply_count = reply_count + 1, updated_at = now()
    WHERE id = NEW.topic_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_topics 
    SET reply_count = reply_count - 1, updated_at = now()
    WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_topic_reply_count_trigger
  AFTER INSERT OR DELETE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_topic_reply_count();

-- Trigger for updating vote counts
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.forum_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE public.forum_posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.forum_posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
    ELSE
      UPDATE public.forum_posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote change
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE public.forum_posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.post_id;
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE public.forum_posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.forum_post_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();