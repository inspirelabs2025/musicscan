-- Add is_bot flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;

-- Create index for bot profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_bot ON public.profiles(is_bot) WHERE is_bot = TRUE;

-- Create function to get random bot user
CREATE OR REPLACE FUNCTION public.get_random_bot_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bot_user_id UUID;
BEGIN
  SELECT user_id INTO bot_user_id
  FROM public.profiles
  WHERE is_bot = TRUE
  ORDER BY random()
  LIMIT 1;
  
  RETURN bot_user_id;
END;
$$;

-- Add comment metadata for tracking AI comments
ALTER TABLE public.blog_comments
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_model TEXT,
ADD COLUMN IF NOT EXISTS generation_cost_tokens INTEGER;

-- Create index for AI comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_is_ai_generated 
ON public.blog_comments(is_ai_generated) WHERE is_ai_generated = TRUE;

-- Create comment generation stats table
CREATE TABLE IF NOT EXISTS public.comment_generation_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_comments_generated INTEGER DEFAULT 0,
  total_posts_processed INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial stats record
INSERT INTO public.comment_generation_stats (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;