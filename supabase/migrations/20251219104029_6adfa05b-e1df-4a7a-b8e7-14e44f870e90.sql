-- Create studio_facebook_queue table for daily automated posting
CREATE TABLE IF NOT EXISTS public.studio_facebook_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_story_id UUID NOT NULL REFERENCES public.studio_stories(id) ON DELETE CASCADE,
  studio_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  artwork_url TEXT,
  location TEXT,
  founded_year INTEGER,
  notable_artists TEXT[],
  priority INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE,
  facebook_post_id TEXT,
  error_message TEXT,
  posted_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_facebook_queue ENABLE ROW LEVEL SECURITY;

-- Create policies (with IF NOT EXISTS workaround)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_facebook_queue' AND policyname = 'System can manage studio facebook queue') THEN
    CREATE POLICY "System can manage studio facebook queue"
      ON public.studio_facebook_queue
      FOR ALL
      USING (true);
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_studio_facebook_queue_status ON public.studio_facebook_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_studio_facebook_queue_story ON public.studio_facebook_queue(studio_story_id);

-- Add posted_count column to studio_stories for rotation tracking
ALTER TABLE public.studio_stories ADD COLUMN IF NOT EXISTS facebook_posted_count INTEGER DEFAULT 0;

-- Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_studio_facebook_queue_updated_at ON public.studio_facebook_queue;
CREATE TRIGGER update_studio_facebook_queue_updated_at
  BEFORE UPDATE ON public.studio_facebook_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Drop and recreate get_all_queue_stats function with studio queue included
DROP FUNCTION IF EXISTS public.get_all_queue_stats();

CREATE FUNCTION public.get_all_queue_stats()
RETURNS TABLE(
  function_name text,
  queue_name text,
  pending bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'photo-batch-processor'::text, 'photo_batch_queue'::text,
    (SELECT COUNT(*) FROM photo_batch_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'singles-batch-processor'::text, 'singles_import_queue'::text,
    (SELECT COUNT(*) FROM singles_import_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'post-scheduled-singles'::text, 'singles_facebook_queue'::text,
    (SELECT COUNT(*) FROM singles_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'post-scheduled-music-history'::text, 'music_history_facebook_queue'::text,
    (SELECT COUNT(*) FROM music_history_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'post-scheduled-youtube'::text, 'youtube_facebook_queue'::text,
    (SELECT COUNT(*) FROM youtube_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'process-podcast-facebook-queue'::text, 'podcast_facebook_queue'::text,
    (SELECT COUNT(*) FROM podcast_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'post-scheduled-studios'::text, 'studio_facebook_queue'::text,
    (SELECT COUNT(*) FROM studio_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'indexnow-processor'::text, 'indexnow_queue'::text,
    (SELECT COUNT(*) FROM indexnow_queue WHERE processed = false)::bigint
  UNION ALL
  SELECT 'artist-stories-batch-processor'::text, 'batch_queue_items'::text,
    (SELECT COUNT(*) FROM batch_queue_items WHERE status = 'pending' AND item_type = 'artist_story')::bigint
  UNION ALL
  SELECT 'render-worker'::text, 'render_jobs'::text,
    (SELECT COUNT(*) FROM render_jobs WHERE status = 'pending')::bigint;
END;
$$;