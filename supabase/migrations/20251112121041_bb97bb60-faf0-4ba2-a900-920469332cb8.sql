-- Add new columns to music_anecdotes table for SEO and extended content
ALTER TABLE music_anecdotes
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS extended_content TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_music_anecdotes_slug ON music_anecdotes(slug);

-- Auto-generate slugs for existing records
UPDATE music_anecdotes 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(anecdote_title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || LEFT(id::TEXT, 8)
WHERE slug IS NULL;