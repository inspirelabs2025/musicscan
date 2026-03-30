CREATE OR REPLACE FUNCTION public.admin_insert_translated_story(
  p_query text,
  p_title text,
  p_story_content text,
  p_slug text,
  p_content_language text,
  p_artist text DEFAULT NULL,
  p_single_name text DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_label text DEFAULT NULL,
  p_catalog text DEFAULT NULL,
  p_album text DEFAULT NULL,
  p_genre text DEFAULT NULL,
  p_artwork_url text DEFAULT NULL,
  p_meta_title text DEFAULT NULL,
  p_meta_description text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporarily disable triggers
  ALTER TABLE music_stories DISABLE TRIGGER trg_notify_new_music_story;
  ALTER TABLE music_stories DISABLE TRIGGER trigger_auto_queue_tiktok_video_singles;
  ALTER TABLE music_stories DISABLE TRIGGER notify_search_engines_music_story;
  
  INSERT INTO music_stories (
    query, title, story_content, slug, is_published, content_language,
    artist, single_name, year, label, catalog, album, genre,
    artwork_url, meta_title, meta_description, user_id, views_count
  ) VALUES (
    p_query, p_title, p_story_content, p_slug, true, p_content_language,
    p_artist, p_single_name, p_year, p_label, p_catalog, p_album, p_genre,
    p_artwork_url, p_meta_title, p_meta_description, p_user_id, 0
  );
  
  -- Re-enable triggers
  ALTER TABLE music_stories ENABLE TRIGGER trg_notify_new_music_story;
  ALTER TABLE music_stories ENABLE TRIGGER trigger_auto_queue_tiktok_video_singles;
  ALTER TABLE music_stories ENABLE TRIGGER notify_search_engines_music_story;
END;
$$;