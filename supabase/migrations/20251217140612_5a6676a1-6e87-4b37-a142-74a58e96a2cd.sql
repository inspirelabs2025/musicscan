-- Add regenerate_pending column to track stories being regenerated
ALTER TABLE music_stories ADD COLUMN IF NOT EXISTS regenerate_pending BOOLEAN DEFAULT NULL;
ALTER TABLE artist_stories ADD COLUMN IF NOT EXISTS regenerate_pending BOOLEAN DEFAULT NULL;
ALTER TABLE music_anecdotes ADD COLUMN IF NOT EXISTS regenerate_pending BOOLEAN DEFAULT NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_music_stories_regenerate ON music_stories(regenerate_pending) WHERE regenerate_pending IS NULL;
CREATE INDEX IF NOT EXISTS idx_artist_stories_regenerate ON artist_stories(regenerate_pending) WHERE regenerate_pending IS NULL;
CREATE INDEX IF NOT EXISTS idx_music_anecdotes_regenerate ON music_anecdotes(regenerate_pending) WHERE regenerate_pending IS NULL;