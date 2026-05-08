-- Backfill missing podcast episode slugs for existing records.
-- The existing trigger public.generate_podcast_episode_slug() fills NEW.slug when it is NULL or empty.
UPDATE public.own_podcast_episodes
SET updated_at = updated_at
WHERE slug IS NULL OR slug = '';