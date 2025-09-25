-- Clean up any OpenAI related dependencies by regenerating types
-- This migration helps resolve OpenAI dependency build errors

-- Add a simple comment to trigger types regeneration
COMMENT ON TABLE news_blog_posts IS 'Enhanced news blog posts with improved validation and Dutch RSS feeds integration';

-- Ensure news_blog_posts table has all needed columns
DO $$
BEGIN
    -- Add author column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'news_blog_posts' AND column_name = 'author') THEN
        ALTER TABLE news_blog_posts ADD COLUMN author TEXT DEFAULT 'Muzieknieuws AI';
    END IF;
END$$;