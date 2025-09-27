-- Create music_stories table for storing generated music stories as blog posts
CREATE TABLE public.music_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  story_content TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_stories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Music stories are viewable by everyone" 
ON public.music_stories 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Users can create their own music stories" 
ON public.music_stories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music stories" 
ON public.music_stories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music stories" 
ON public.music_stories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_music_stories_updated_at
BEFORE UPDATE ON public.music_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();