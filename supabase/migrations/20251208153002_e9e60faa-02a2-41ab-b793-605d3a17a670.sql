-- Add music_story_id and priority to tiktok_video_queue
ALTER TABLE tiktok_video_queue 
ADD COLUMN IF NOT EXISTS music_story_id UUID REFERENCES music_stories(id),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Create index for priority-based ordering
CREATE INDEX IF NOT EXISTS idx_tiktok_video_queue_priority 
ON tiktok_video_queue(priority DESC, created_at ASC) 
WHERE status = 'pending';

-- Add video_url to music_stories for storing generated GIF
ALTER TABLE music_stories 
ADD COLUMN IF NOT EXISTS video_url TEXT;