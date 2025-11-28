-- Add duration_minutes column to youtube_discoveries table
ALTER TABLE youtube_discoveries 
ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_youtube_discoveries_duration_minutes ON youtube_discoveries(duration_minutes);