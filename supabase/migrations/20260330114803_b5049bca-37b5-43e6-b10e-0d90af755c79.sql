-- Add content_language column to music_stories (default 'nl' for existing rows)
ALTER TABLE music_stories ADD COLUMN IF NOT EXISTS content_language text NOT NULL DEFAULT 'nl';

-- Add content_language column to blog_posts (default 'nl' for existing rows)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_language text NOT NULL DEFAULT 'nl';

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_music_stories_content_language ON music_stories(content_language);
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_language ON blog_posts(content_language);