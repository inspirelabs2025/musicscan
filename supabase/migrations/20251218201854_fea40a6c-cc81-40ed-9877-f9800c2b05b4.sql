-- Add country_code column to all story tables for AI-based country detection

-- 1. Singles (music_stories)
ALTER TABLE public.music_stories ADD COLUMN IF NOT EXISTS country_code TEXT;
CREATE INDEX IF NOT EXISTS idx_music_stories_country_code ON public.music_stories(country_code);

-- 2. Albums (blog_posts)
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS country_code TEXT;
CREATE INDEX IF NOT EXISTS idx_blog_posts_country_code ON public.blog_posts(country_code);

-- 3. Artists (artist_stories)
ALTER TABLE public.artist_stories ADD COLUMN IF NOT EXISTS country_code TEXT;
CREATE INDEX IF NOT EXISTS idx_artist_stories_country_code ON public.artist_stories(country_code);

-- 4. Curated Artists (source for story generation)
ALTER TABLE public.curated_artists ADD COLUMN IF NOT EXISTS country_code TEXT;
CREATE INDEX IF NOT EXISTS idx_curated_artists_country_code ON public.curated_artists(country_code);

-- Add comments for documentation
COMMENT ON COLUMN public.music_stories.country_code IS 'ISO 3166-1 alpha-2 country code of the artist (e.g., NL, US, FR)';
COMMENT ON COLUMN public.blog_posts.country_code IS 'ISO 3166-1 alpha-2 country code of the artist (e.g., NL, US, FR)';
COMMENT ON COLUMN public.artist_stories.country_code IS 'ISO 3166-1 alpha-2 country code of the artist (e.g., NL, US, FR)';
COMMENT ON COLUMN public.curated_artists.country_code IS 'ISO 3166-1 alpha-2 country code of the artist (e.g., NL, US, FR)';