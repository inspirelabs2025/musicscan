-- Fix 'Vandaag' for sitemap-queue-processor: count RUNS (3-min buckets) instead of log rows.
-- Date window is UTC midnight->midnight.

CREATE OR REPLACE FUNCTION public.get_cronjob_last_output()
RETURNS TABLE (
  cronjob_name text,
  output_table text,
  last_output_at timestamptz,
  items_today bigint
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  day_start timestamptz := (date_trunc('day', now() at time zone 'utc') at time zone 'utc');
  day_end   timestamptz := (date_trunc('day', now() at time zone 'utc') at time zone 'utc') + interval '1 day';
BEGIN
  -- CONTENT GENERATIE
  BEGIN
    RETURN QUERY
    SELECT
      'daily-anecdote-generator',
      'music_anecdotes',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.music_anecdotes;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'daily-anecdote-generator','music_anecdotes',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'generate-daily-music-history',
      'music_history_events',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.music_history_events;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'generate-daily-music-history','music_history_events',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'daily-artist-stories-generator',
      'batch_queue_items',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end AND item_type = 'artist_story')
    FROM public.batch_queue_items;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'daily-artist-stories-generator','batch_queue_items',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'artist-stories-batch-processor',
      'artist_stories',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.artist_stories;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'artist-stories-batch-processor','artist_stories',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'singles-batch-processor',
      'music_stories',
      max(created_at),
      count(*) FILTER (
        WHERE created_at >= day_start AND created_at < day_end
          AND single_name IS NOT NULL
      )
    FROM public.music_stories;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'singles-batch-processor','music_stories',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY
      SELECT
        'singles-batch-processor',
        'music_stories',
        max(created_at),
        count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
      FROM public.music_stories;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'batch-blog-processor',
      'blog_posts',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.blog_posts;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'batch-blog-processor','blog_posts',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'latest-discogs-news',
      'news_blog_posts',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.news_blog_posts;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'latest-discogs-news','news_blog_posts',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'generate-daily-challenge',
      'daily_challenges',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.daily_challenges;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'generate-daily-challenge','daily_challenges',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'daily-youtube-discoveries',
      'youtube_music_videos',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.youtube_music_videos;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'daily-youtube-discoveries','youtube_music_videos',null::timestamptz,0::bigint;
  END;

  -- DATA IMPORT
  BEGIN
    RETURN QUERY
    SELECT
      'discogs-lp-crawler',
      'discogs_import_log',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.discogs_import_log;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'discogs-lp-crawler','discogs_import_log',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'process-discogs-queue',
      'discogs_import_log',
      max(processed_at),
      count(*) FILTER (WHERE processed_at >= day_start AND processed_at < day_end)
    FROM public.discogs_import_log;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'process-discogs-queue','discogs_import_log',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'process-discogs-queue','discogs_import_log',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'generate-curated-artists',
      'curated_artists',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.curated_artists;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'generate-curated-artists','curated_artists',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'process-spotify-new-releases',
      'spotify_new_releases_processed',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.spotify_new_releases_processed;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'process-spotify-new-releases','spotify_new_releases_processed',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'queue-dance-house-content',
      'batch_queue_items',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end AND item_type IN ('dance_house','dance-house','genre_hub'))
    FROM public.batch_queue_items;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'queue-dance-house-content','batch_queue_items',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'queue-dance-house-content','batch_queue_items',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'top2000-auto-processor',
      'top2000_songs',
      max(enriched_at),
      count(*) FILTER (WHERE enriched_at >= day_start AND enriched_at < day_end)
    FROM public.top2000_songs;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'top2000-auto-processor','top2000_songs',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'top2000-auto-processor','top2000_songs',null::timestamptz,0::bigint;
  END;

  -- SOCIAL MEDIA
  BEGIN
    RETURN QUERY
    SELECT
      'schedule-music-history-posts',
      'music_history_facebook_queue',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.music_history_facebook_queue;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'schedule-music-history-posts','music_history_facebook_queue',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'post-scheduled-music-history',
      'music_history_facebook_queue',
      max(posted_at),
      count(*) FILTER (WHERE posted_at >= day_start AND posted_at < day_end)
    FROM public.music_history_facebook_queue;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'post-scheduled-music-history','music_history_facebook_queue',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'post-scheduled-music-history','music_history_facebook_queue',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'post-scheduled-singles',
      'singles_facebook_queue',
      max(posted_at),
      count(*) FILTER (WHERE posted_at >= day_start AND posted_at < day_end)
    FROM public.singles_facebook_queue;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'post-scheduled-singles','singles_facebook_queue',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'post-scheduled-singles','singles_facebook_queue',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'schedule-youtube-posts',
      'youtube_facebook_queue',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.youtube_facebook_queue;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'schedule-youtube-posts','youtube_facebook_queue',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'post-scheduled-youtube',
      'youtube_facebook_queue',
      max(posted_at),
      count(*) FILTER (WHERE posted_at >= day_start AND posted_at < day_end)
    FROM public.youtube_facebook_queue;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'post-scheduled-youtube','youtube_facebook_queue',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'post-scheduled-youtube','youtube_facebook_queue',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'process-podcast-facebook-queue',
      'podcast_facebook_queue',
      max(posted_at),
      count(*) FILTER (WHERE posted_at >= day_start AND posted_at < day_end)
    FROM public.podcast_facebook_queue;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'process-podcast-facebook-queue','podcast_facebook_queue',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'process-podcast-facebook-queue','podcast_facebook_queue',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'schedule-weekly-podcast-posts',
      'podcast_facebook_queue',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.podcast_facebook_queue;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'schedule-weekly-podcast-posts','podcast_facebook_queue',null::timestamptz,0::bigint;
  END;

  -- SEO
  BEGIN
    RETURN QUERY
    SELECT
      'indexnow-processor',
      'indexnow_queue',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.indexnow_queue;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'indexnow-processor','indexnow_queue',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'indexnow-processor','indexnow_queue',max(updated_at),0::bigint FROM public.indexnow_queue;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'indexnow-cron',
      'indexnow_submissions',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.indexnow_submissions;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'indexnow-cron','indexnow_submissions',null::timestamptz,0::bigint;
  END;

  -- ✅ IMPORTANT: sitemap-queue-processor counts RUN BUCKETS (3 min) instead of raw rows.
  BEGIN
    RETURN QUERY
    SELECT
      'sitemap-queue-processor',
      'sitemap_logs',
      max(created_at),
      count(distinct (date_trunc('hour', created_at) + (floor(extract(minute from created_at)/3)::int * interval '3 minutes')))
        FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.sitemap_logs;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'sitemap-queue-processor','sitemap_logs',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'generate-static-sitemaps',
      'sitemap_logs',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.sitemap_logs;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'generate-static-sitemaps','sitemap_logs',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'generate-llm-sitemap',
      'sitemap_logs',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.sitemap_logs;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'generate-llm-sitemap','sitemap_logs',null::timestamptz,0::bigint;
  END;

  -- PRODUCTS
  BEGIN
    RETURN QUERY
    SELECT
      'bulk-poster-processor',
      'platform_products',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.platform_products;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'bulk-poster-processor','platform_products',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'backfill-christmas-socks',
      'album_socks',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.album_socks;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'backfill-christmas-socks','album_socks',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'repair-christmas-sock-images',
      'album_socks',
      max(updated_at),
      count(*) FILTER (WHERE updated_at >= day_start AND updated_at < day_end)
    FROM public.album_socks;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'repair-christmas-sock-images','album_socks',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'repair-christmas-sock-images','album_socks',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'process-tiktok-video-queue',
      'render_jobs',
      max(updated_at),
      count(*) FILTER (WHERE updated_at >= day_start AND updated_at < day_end)
    FROM public.render_jobs;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'process-tiktok-video-queue','render_jobs',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'process-tiktok-video-queue','render_jobs',null::timestamptz,0::bigint;
  END;

  -- COMMUNITY
  BEGIN
    RETURN QUERY
    SELECT
      'refresh-featured-photos',
      'photos',
      max(updated_at),
      count(*) FILTER (WHERE updated_at >= day_start AND updated_at < day_end)
    FROM public.photos;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'refresh-featured-photos','photos',null::timestamptz,0::bigint;
    WHEN undefined_column THEN
      RETURN QUERY SELECT 'refresh-featured-photos','photos',null::timestamptz,0::bigint;
  END;

  BEGIN
    RETURN QUERY
    SELECT
      'weekly-forum-discussions',
      'forum_topics',
      max(created_at),
      count(*) FILTER (WHERE created_at >= day_start AND created_at < day_end)
    FROM public.forum_topics;
  EXCEPTION WHEN undefined_table THEN
    RETURN QUERY SELECT 'weekly-forum-discussions','forum_topics',null::timestamptz,0::bigint;
  END;

END;
$$;