-- Create singles Facebook queue table
CREATE TABLE public.singles_facebook_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  music_story_id UUID NOT NULL REFERENCES public.music_stories(id) ON DELETE CASCADE,
  artist TEXT NOT NULL,
  single_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  artwork_url TEXT,
  priority INTEGER NOT NULL DEFAULT 0, -- Higher = more priority (new singles get 100)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'skipped')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  facebook_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(music_story_id)
);

-- Enable RLS
ALTER TABLE public.singles_facebook_queue ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage singles facebook queue" 
ON public.singles_facebook_queue 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for efficient queue processing
CREATE INDEX idx_singles_fb_queue_status_priority ON public.singles_facebook_queue(status, priority DESC, created_at ASC);
CREATE INDEX idx_singles_fb_queue_music_story ON public.singles_facebook_queue(music_story_id);

-- Trigger for updated_at
CREATE TRIGGER update_singles_facebook_queue_updated_at
BEFORE UPDATE ON public.singles_facebook_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();