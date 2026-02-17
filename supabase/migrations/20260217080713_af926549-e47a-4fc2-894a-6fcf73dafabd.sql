
-- Make actor_id nullable for system notifications
ALTER TABLE public.notifications ALTER COLUMN actor_id DROP NOT NULL;

-- Add message, link and icon columns for flexible notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS icon text;

-- Create function to insert system notifications for all users or specific user
CREATE OR REPLACE FUNCTION public.create_system_notification(
  p_user_id uuid,
  p_type text,
  p_message text,
  p_link text DEFAULT NULL,
  p_icon text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, message, link, icon, is_read)
  VALUES (p_user_id, p_user_id, p_type, p_message, p_link, p_icon, false);
END;
$$;

-- Trigger: New published music_stories → notify all users
CREATE OR REPLACE FUNCTION public.notify_new_music_story()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, message, link, icon, is_read)
    SELECT p.user_id, NEW.user_id, 'new_content', 
      '🎵 Nieuw verhaal: ' || COALESCE(NEW.artist, '') || ' - ' || COALESCE(NEW.title, ''),
      '/muziek-verhaal/' || NEW.slug,
      'music',
      false
    FROM public.profiles p
    WHERE p.user_id != COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_music_story ON public.music_stories;
CREATE TRIGGER trg_notify_new_music_story
  AFTER INSERT OR UPDATE ON public.music_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_music_story();

-- Trigger: New published artist_stories → notify all users
CREATE OR REPLACE FUNCTION public.notify_new_artist_story()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, message, link, icon, is_read)
    SELECT p.user_id, NEW.user_id, 'new_content',
      '🎤 Nieuw artiestenverhaal: ' || NEW.artist_name,
      '/artists/' || NEW.slug,
      'artist',
      false
    FROM public.profiles p
    WHERE p.user_id != COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_artist_story ON public.artist_stories;
CREATE TRIGGER trg_notify_new_artist_story
  AFTER INSERT OR UPDATE ON public.artist_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_artist_story();

-- Trigger: Quiz badge earned → notify user
CREATE OR REPLACE FUNCTION public.notify_quiz_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.create_system_notification(
    NEW.user_id,
    'badge_earned',
    '🏆 Nieuwe badge verdiend: ' || COALESCE(NEW.badge_name, 'Badge'),
    '/quizzen',
    'trophy'
  );
  RETURN NEW;
END;
$$;

-- Check if quiz_badges table exists before creating trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_badges' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_notify_quiz_badge ON public.quiz_badges;
    CREATE TRIGGER trg_notify_quiz_badge
      AFTER INSERT ON public.quiz_badges
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_quiz_badge();
  END IF;
END;
$$;

-- Trigger: Collection milestone (every 10 items in ai_scan_results)
CREATE OR REPLACE FUNCTION public.notify_collection_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  item_count integer;
BEGIN
  SELECT COUNT(*) INTO item_count
  FROM public.ai_scan_results
  WHERE user_id = NEW.user_id AND status = 'completed';

  IF item_count > 0 AND item_count % 10 = 0 THEN
    PERFORM public.create_system_notification(
      NEW.user_id,
      'collection_milestone',
      '📊 Gefeliciteerd! Je collectie heeft ' || item_count || ' items bereikt!',
      '/dashboard',
      'milestone'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_collection_milestone ON public.ai_scan_results;
CREATE TRIGGER trg_notify_collection_milestone
  AFTER INSERT ON public.ai_scan_results
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_collection_milestone();

-- Trigger: Photo comment → notify photo owner
CREATE OR REPLACE FUNCTION public.notify_photo_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  photo_owner_id uuid;
BEGIN
  SELECT user_id INTO photo_owner_id
  FROM public.fanwall_photos
  WHERE id = NEW.photo_id;

  IF photo_owner_id IS NOT NULL AND photo_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, photo_id, comment_id, message, link, icon, is_read)
    VALUES (photo_owner_id, NEW.user_id, 'photo_comment', NEW.photo_id, NEW.id,
      '💬 Iemand heeft gereageerd op je foto',
      '/fanwall',
      'comment',
      false);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_photo_comment ON public.photo_comments;
CREATE TRIGGER trg_notify_photo_comment
  AFTER INSERT ON public.photo_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_photo_comment();

-- Trigger: Photo like → notify photo owner
CREATE OR REPLACE FUNCTION public.notify_photo_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  photo_owner_id uuid;
BEGIN
  SELECT user_id INTO photo_owner_id
  FROM public.fanwall_photos
  WHERE id = NEW.photo_id;

  IF photo_owner_id IS NOT NULL AND photo_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, photo_id, message, link, icon, is_read)
    VALUES (photo_owner_id, NEW.user_id, 'photo_like', NEW.photo_id,
      '❤️ Iemand vond je foto leuk',
      '/fanwall',
      'heart',
      false);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_photo_like ON public.photo_likes;
CREATE TRIGGER trg_notify_photo_like
  AFTER INSERT ON public.photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_photo_like();

-- Trigger: New news article → notify all users
CREATE OR REPLACE FUNCTION public.notify_new_news()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    INSERT INTO public.notifications (user_id, actor_id, type, message, link, icon, is_read)
    SELECT p.user_id, p.user_id, 'new_news',
      '📰 Nieuw artikel: ' || COALESCE(NEW.title, ''),
      '/nieuws/' || NEW.slug,
      'news',
      false
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_news ON public.news_blog_posts;
CREATE TRIGGER trg_notify_new_news
  AFTER INSERT OR UPDATE ON public.news_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_news();
