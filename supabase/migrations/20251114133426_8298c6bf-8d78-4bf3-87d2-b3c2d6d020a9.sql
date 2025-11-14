-- Extend artist_stories table for spotlight feature
ALTER TABLE artist_stories 
ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spotlight_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS spotlight_description TEXT,
ADD COLUMN IF NOT EXISTS featured_products UUID[] DEFAULT '{}';

-- Create index for spotlight queries
CREATE INDEX IF NOT EXISTS idx_artist_stories_spotlight 
ON artist_stories(is_spotlight, published_at) 
WHERE is_spotlight = TRUE AND is_published = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN artist_stories.is_spotlight IS 'Marks this story as a featured spotlight article with extended content';
COMMENT ON COLUMN artist_stories.spotlight_images IS 'Array of image objects: [{url, caption, type, alt_text}]';
COMMENT ON COLUMN artist_stories.spotlight_description IS 'Short teaser/description for spotlight overview';
COMMENT ON COLUMN artist_stories.featured_products IS 'Array of platform_products UUIDs to feature on spotlight page';