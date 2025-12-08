-- Voeg unique constraints toe voor ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS tiktok_video_queue_blog_id_unique ON tiktok_video_queue (blog_id) WHERE blog_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tiktok_video_queue_music_story_id_unique ON tiktok_video_queue (music_story_id) WHERE music_story_id IS NOT NULL;

-- Trigger functie voor automatische TikTok video queueing van blog posts
CREATE OR REPLACE FUNCTION public.auto_queue_tiktok_video_blog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Alleen voor blog posts met album_cover_url
  IF NEW.album_cover_url IS NOT NULL THEN
    INSERT INTO tiktok_video_queue (blog_id, album_cover_url, artist, title, priority, status)
    VALUES (
      NEW.id,
      NEW.album_cover_url,
      COALESCE((NEW.yaml_frontmatter->>'artist')::text, 'Unknown'),
      COALESCE((NEW.yaml_frontmatter->>'title')::text, 'Unknown'),
      50,
      'pending'
    )
    ON CONFLICT (blog_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger functie voor automatische TikTok video queueing van music stories (singles)
CREATE OR REPLACE FUNCTION public.auto_queue_tiktok_video_singles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Alleen voor singles met artwork_url
  IF NEW.artwork_url IS NOT NULL AND NEW.single_name IS NOT NULL THEN
    INSERT INTO tiktok_video_queue (music_story_id, album_cover_url, artist, title, priority, status)
    VALUES (
      NEW.id,
      NEW.artwork_url,
      COALESCE(NEW.artist_name, 'Unknown'),
      COALESCE(NEW.single_name, 'Unknown'),
      100,
      'pending'
    )
    ON CONFLICT (music_story_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger voor blog_posts
DROP TRIGGER IF EXISTS trigger_auto_queue_tiktok_video_blog ON blog_posts;
CREATE TRIGGER trigger_auto_queue_tiktok_video_blog
AFTER INSERT ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION auto_queue_tiktok_video_blog();

-- Trigger voor music_stories (singles)
DROP TRIGGER IF EXISTS trigger_auto_queue_tiktok_video_singles ON music_stories;
CREATE TRIGGER trigger_auto_queue_tiktok_video_singles
AFTER INSERT ON music_stories
FOR EACH ROW
EXECUTE FUNCTION auto_queue_tiktok_video_singles();

-- Backfill: Voeg bestaande blog posts toe die nog geen TikTok video hebben
INSERT INTO tiktok_video_queue (blog_id, album_cover_url, artist, title, priority, status)
SELECT 
  bp.id,
  bp.album_cover_url,
  COALESCE((bp.yaml_frontmatter->>'artist')::text, 'Unknown'),
  COALESCE((bp.yaml_frontmatter->>'title')::text, 'Unknown'),
  50,
  'pending'
FROM blog_posts bp
WHERE NOT EXISTS (SELECT 1 FROM tiktok_video_queue tvq WHERE tvq.blog_id = bp.id)
  AND bp.album_cover_url IS NOT NULL;