-- Create queue table for YouTube Facebook posts
CREATE TABLE IF NOT EXISTS public.youtube_facebook_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  video_data JSONB NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  posted_at TIMESTAMPTZ,
  facebook_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_youtube_fb_queue_status_time ON youtube_facebook_queue(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_youtube_fb_queue_video_id ON youtube_facebook_queue(video_id);

-- Enable RLS
ALTER TABLE youtube_facebook_queue ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON youtube_facebook_queue
  FOR ALL USING (true) WITH CHECK (true);