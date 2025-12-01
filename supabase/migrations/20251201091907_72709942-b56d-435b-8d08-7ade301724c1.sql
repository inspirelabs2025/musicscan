-- Create queue table for scheduled music history Facebook posts
CREATE TABLE public.music_history_facebook_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_index INTEGER NOT NULL,
  event_data JSONB NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  facebook_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_music_history_fb_queue_scheduled ON music_history_facebook_queue(scheduled_time, status);
CREATE INDEX idx_music_history_fb_queue_date ON music_history_facebook_queue(event_date);

-- Enable RLS
ALTER TABLE music_history_facebook_queue ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for admin dashboard)
CREATE POLICY "Allow public read access to music history queue"
ON music_history_facebook_queue FOR SELECT
USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to music history queue"
ON music_history_facebook_queue FOR ALL
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_music_history_fb_queue_updated_at
BEFORE UPDATE ON music_history_facebook_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert music_history into facebook_auto_post_settings
INSERT INTO facebook_auto_post_settings (
  content_type, 
  is_enabled, 
  schedule_type, 
  schedule_hour,
  max_posts_per_day,
  custom_hashtags
) VALUES (
  'music_history',
  true,
  'daily',
  8,
  8,
  ARRAY['WistJeDat', 'MuziekGeschiedenis', 'OnThisDay', 'MusicHistory']
) ON CONFLICT (content_type) DO UPDATE SET
  is_enabled = true,
  max_posts_per_day = 8;