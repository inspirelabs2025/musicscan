-- Add sitemap-queue-processor to get_cronjob_last_output
CREATE OR REPLACE FUNCTION public.get_cronjob_last_output()
RETURNS TABLE(cronjob_name text, output_table text, last_output_at timestamp with time zone, items_today bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  -- music_anecdotes
  SELECT 'generate-daily-anecdote'::text, 'music_anecdotes'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM music_anecdotes
  UNION ALL
  -- artist_stories
  SELECT 'artist-stories-batch-processor'::text, 'artist_stories'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM artist_stories
  UNION ALL
  -- music_stories (singles)
  SELECT 'singles-batch-processor'::text, 'music_stories'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM music_stories WHERE single_name IS NOT NULL
  UNION ALL
  -- blog_posts
  SELECT 'process-spotify-new-releases'::text, 'blog_posts'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM blog_posts
  UNION ALL
  -- music_history_events
  SELECT 'generate-daily-music-history'::text, 'music_history_events'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM music_history_events
  UNION ALL
  -- daily_challenges
  SELECT 'generate-daily-challenge'::text, 'daily_challenges'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM daily_challenges
  UNION ALL
  -- spotify_new_releases_processed
  SELECT 'spotify-new-releases'::text, 'spotify_new_releases_processed'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM spotify_new_releases_processed
  UNION ALL
  -- facebook_post_log (music history)
  SELECT 'post-scheduled-music-history'::text, 'facebook_post_log'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND content_type = 'music_history')
  FROM facebook_post_log
  UNION ALL
  -- facebook_post_log (youtube)
  SELECT 'post-scheduled-youtube'::text, 'facebook_post_log'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND content_type = 'youtube')
  FROM facebook_post_log WHERE content_type = 'youtube'
  UNION ALL
  -- facebook_post_log (singles)
  SELECT 'post-scheduled-singles-cron'::text, 'facebook_post_log'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND content_type = 'single')
  FROM facebook_post_log WHERE content_type = 'single'
  UNION ALL
  -- platform_products
  SELECT 'create-art-product'::text, 'platform_products'::text,
         MAX(created_at), COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  FROM platform_products
  UNION ALL
  -- photos
  SELECT 'refresh-featured-photos'::text, 'photos'::text,
         MAX(published_at), COUNT(*) FILTER (WHERE DATE(published_at) = CURRENT_DATE)
  FROM photos
  UNION ALL
  -- indexnow_submissions
  SELECT 'indexnow-processor'::text, 'indexnow_submissions'::text,
         MAX(submitted_at), COUNT(*) FILTER (WHERE DATE(submitted_at) = CURRENT_DATE)
  FROM indexnow_submissions
  UNION ALL
  -- indexnow_submissions for indexnow-cron
  SELECT 'indexnow-cron'::text, 'indexnow_submissions'::text,
         MAX(submitted_at), COUNT(*) FILTER (WHERE DATE(submitted_at) = CURRENT_DATE)
  FROM indexnow_submissions
  UNION ALL
  -- sitemap_regeneration_log for sitemap-queue-processor
  SELECT 'sitemap-queue-processor'::text, 'sitemap_regeneration_log'::text,
         MAX(started_at), COUNT(*) FILTER (WHERE DATE(started_at) = CURRENT_DATE)
  FROM sitemap_regeneration_log;
END;
$function$;