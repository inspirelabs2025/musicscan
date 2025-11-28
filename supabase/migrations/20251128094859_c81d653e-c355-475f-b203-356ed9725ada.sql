-- Add tags column to youtube_discoveries table
ALTER TABLE youtube_discoveries 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add index for better tag search performance
CREATE INDEX IF NOT EXISTS idx_youtube_discoveries_tags ON youtube_discoveries USING gin(tags);