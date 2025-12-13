-- Table for podcast Facebook queue
CREATE TABLE public.podcast_facebook_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES public.own_podcast_episodes(id) ON DELETE CASCADE,
  podcast_id UUID REFERENCES public.own_podcasts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  post_type TEXT NOT NULL DEFAULT 'new_episode' CHECK (post_type IN ('new_episode', 'scheduled_rotation')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE,
  facebook_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track rotation cycle (ensure equal posting)
CREATE TABLE public.podcast_rotation_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.own_podcast_episodes(id) ON DELETE CASCADE UNIQUE,
  times_posted INTEGER NOT NULL DEFAULT 0,
  last_posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.podcast_facebook_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_rotation_tracker ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage podcast facebook queue"
ON public.podcast_facebook_queue FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage podcast rotation tracker"
ON public.podcast_rotation_tracker FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX idx_podcast_facebook_queue_status ON public.podcast_facebook_queue(status);
CREATE INDEX idx_podcast_facebook_queue_scheduled ON public.podcast_facebook_queue(scheduled_for);
CREATE INDEX idx_podcast_rotation_times ON public.podcast_rotation_tracker(times_posted);

-- Function to auto-queue new episodes
CREATE OR REPLACE FUNCTION public.auto_queue_new_podcast_episode()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if episode is published
  IF NEW.is_published = true THEN
    -- Add to Facebook queue for immediate posting
    INSERT INTO public.podcast_facebook_queue (episode_id, podcast_id, post_type, scheduled_for)
    VALUES (NEW.id, NEW.podcast_id, 'new_episode', now())
    ON CONFLICT DO NOTHING;
    
    -- Add to rotation tracker
    INSERT INTO public.podcast_rotation_tracker (episode_id, times_posted)
    VALUES (NEW.id, 0)
    ON CONFLICT (episode_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new episodes
CREATE TRIGGER trigger_auto_queue_podcast_episode
AFTER INSERT OR UPDATE OF is_published ON public.own_podcast_episodes
FOR EACH ROW
EXECUTE FUNCTION public.auto_queue_new_podcast_episode();

-- Timestamp trigger
CREATE TRIGGER update_podcast_facebook_queue_updated_at
BEFORE UPDATE ON public.podcast_facebook_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_podcast_rotation_tracker_updated_at
BEFORE UPDATE ON public.podcast_rotation_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();