CREATE OR REPLACE FUNCTION get_cronjob_last_output()
RETURNS TABLE(cronjob_name text, output_table text, last_output_at timestamptz, items_today bigint) 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  today_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC');
  today_end timestamptz := today_start + interval '1 day';
BEGIN
  RETURN QUERY
  
  -- artist-stories-batch-processor -> artist_stories
  SELECT 
    'artist-stories-batch-processor'::text,
    'artist_stories'::text,
    max(created_at),
    count(*)::bigint
  FROM artist_stories
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- singles-batch-processor -> music_stories (singles only)
  SELECT 
    'singles-batch-processor'::text,
    'music_stories'::text,
    max(created_at),
    count(*)::bigint
  FROM music_stories
  WHERE created_at >= today_start AND created_at < today_end
    AND single_name IS NOT NULL
  
  UNION ALL
  
  -- daily-anecdote-generator -> music_anecdotes
  SELECT 
    'daily-anecdote-generator'::text,
    'music_anecdotes'::text,
    max(created_at),
    count(*)::bigint
  FROM music_anecdotes
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- generate-daily-music-history -> music_history_events
  SELECT 
    'generate-daily-music-history'::text,
    'music_history_events'::text,
    max(created_at),
    count(*)::bigint
  FROM music_history_events
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- schedule-music-history-posts -> music_history_facebook_queue (scheduled today)
  SELECT 
    'schedule-music-history-posts'::text,
    'music_history_facebook_queue'::text,
    max(created_at),
    count(*)::bigint
  FROM music_history_facebook_queue
  WHERE DATE(scheduled_time AT TIME ZONE 'UTC') = DATE(now() AT TIME ZONE 'UTC')
  
  UNION ALL
  
  -- batch-blog-processor -> blog_posts
  SELECT 
    'batch-blog-processor'::text,
    'blog_posts'::text,
    max(created_at),
    count(*)::bigint
  FROM blog_posts
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- latest-discogs-news -> news_blog_posts
  SELECT 
    'latest-discogs-news'::text,
    'news_blog_posts'::text,
    max(created_at),
    count(*)::bigint
  FROM news_blog_posts
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- generate-daily-challenge -> daily_challenges
  SELECT 
    'generate-daily-challenge'::text,
    'daily_challenges'::text,
    max(created_at),
    count(*)::bigint
  FROM daily_challenges
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- daily-youtube-discoveries -> youtube_discoveries
  SELECT 
    'daily-youtube-discoveries'::text,
    'youtube_discoveries'::text,
    max(created_at),
    count(*)::bigint
  FROM youtube_discoveries
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- discogs-lp-crawler -> discogs_import_log (new items queued)
  SELECT 
    'discogs-lp-crawler'::text,
    'discogs_import_log'::text,
    max(created_at),
    count(*)::bigint
  FROM discogs_import_log
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- process-discogs-queue -> platform_products (via discogs_id)
  SELECT 
    'process-discogs-queue'::text,
    'platform_products'::text,
    max(created_at),
    count(*)::bigint
  FROM platform_products
  WHERE created_at >= today_start AND created_at < today_end
    AND discogs_id IS NOT NULL
  
  UNION ALL
  
  -- generate-curated-artists -> curated_artists
  SELECT 
    'generate-curated-artists'::text,
    'curated_artists'::text,
    max(created_at),
    count(*)::bigint
  FROM curated_artists
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- process-spotify-new-releases -> spotify_new_releases_processed
  SELECT 
    'process-spotify-new-releases'::text,
    'spotify_new_releases_processed'::text,
    max(processed_at),
    count(*)::bigint
  FROM spotify_new_releases_processed
  WHERE processed_at >= today_start AND processed_at < today_end
  
  UNION ALL
  
  -- indexnow-processor -> indexnow_queue (processed=true today)
  SELECT 
    'indexnow-processor'::text,
    'indexnow_queue'::text,
    max(processed_at),
    count(*)::bigint
  FROM indexnow_queue
  WHERE processed_at >= today_start AND processed_at < today_end
    AND processed = true
  
  UNION ALL
  
  -- indexnow-cron -> indexnow_submissions (submitted today)
  SELECT 
    'indexnow-cron'::text,
    'indexnow_submissions'::text,
    max(submitted_at),
    count(*)::bigint
  FROM indexnow_submissions
  WHERE submitted_at >= today_start AND submitted_at < today_end
  
  UNION ALL
  
  -- post-scheduled-music-history -> music_history_facebook_queue (posted today)
  SELECT 
    'post-scheduled-music-history'::text,
    'music_history_facebook_queue'::text,
    max(posted_at),
    count(*)::bigint
  FROM music_history_facebook_queue
  WHERE posted_at >= today_start AND posted_at < today_end
    AND status = 'posted'
  
  UNION ALL
  
  -- post-scheduled-singles -> singles_facebook_queue (posted today)
  SELECT 
    'post-scheduled-singles'::text,
    'singles_facebook_queue'::text,
    max(posted_at),
    count(*)::bigint
  FROM singles_facebook_queue
  WHERE posted_at >= today_start AND posted_at < today_end
    AND status = 'posted'
  
  UNION ALL
  
  -- schedule-youtube-posts -> youtube_facebook_queue (scheduled today)
  SELECT 
    'schedule-youtube-posts'::text,
    'youtube_facebook_queue'::text,
    max(created_at),
    count(*)::bigint
  FROM youtube_facebook_queue
  WHERE DATE(scheduled_time AT TIME ZONE 'UTC') = DATE(now() AT TIME ZONE 'UTC')
  
  UNION ALL
  
  -- post-scheduled-youtube -> youtube_facebook_queue (posted today)
  SELECT 
    'post-scheduled-youtube'::text,
    'youtube_facebook_queue'::text,
    max(posted_at),
    count(*)::bigint
  FROM youtube_facebook_queue
  WHERE posted_at >= today_start AND posted_at < today_end
    AND status = 'posted'
  
  UNION ALL
  
  -- process-podcast-facebook-queue -> podcast_facebook_queue (posted today)
  SELECT 
    'process-podcast-facebook-queue'::text,
    'podcast_facebook_queue'::text,
    max(posted_at),
    count(*)::bigint
  FROM podcast_facebook_queue
  WHERE posted_at >= today_start AND posted_at < today_end
    AND status = 'posted'
  
  UNION ALL
  
  -- bulk-poster-processor -> platform_products (poster type)
  SELECT 
    'bulk-poster-processor'::text,
    'platform_products'::text,
    max(created_at),
    count(*)::bigint
  FROM platform_products
  WHERE created_at >= today_start AND created_at < today_end
    AND media_type = 'POSTER'
  
  UNION ALL
  
  -- process-tiktok-video-queue -> render_jobs (completed today)
  SELECT 
    'process-tiktok-video-queue'::text,
    'render_jobs'::text,
    max(completed_at),
    count(*)::bigint
  FROM render_jobs
  WHERE completed_at >= today_start AND completed_at < today_end
    AND status = 'completed'
  
  UNION ALL
  
  -- refresh-featured-photos -> photos (published today)
  SELECT 
    'refresh-featured-photos'::text,
    'photos'::text,
    max(published_at),
    count(*)::bigint
  FROM photos
  WHERE published_at >= today_start AND published_at < today_end
  
  UNION ALL
  
  -- top2000-auto-processor -> top2000_songs (enriched today)
  SELECT 
    'top2000-auto-processor'::text,
    'top2000_songs'::text,
    max(enriched_at),
    count(*)::bigint
  FROM top2000_songs
  WHERE enriched_at >= today_start AND enriched_at < today_end
  
  UNION ALL
  
  -- backfill-christmas-socks -> album_socks (christmas pattern)
  SELECT 
    'backfill-christmas-socks'::text,
    'album_socks'::text,
    max(created_at),
    count(*)::bigint
  FROM album_socks
  WHERE created_at >= today_start AND created_at < today_end
    AND pattern_type = 'christmas'
  
  UNION ALL
  
  -- composer-batch-processor -> music_stories (composer/soundtrack type)
  SELECT 
    'composer-batch-processor'::text,
    'music_stories'::text,
    max(created_at),
    count(*)::bigint
  FROM music_stories
  WHERE created_at >= today_start AND created_at < today_end
    AND (genre ILIKE '%soundtrack%' OR genre ILIKE '%film%')
  
  UNION ALL
  
  -- queue-dance-house-content -> singles_import_queue (dance/house)
  SELECT 
    'queue-dance-house-content'::text,
    'singles_import_queue'::text,
    max(created_at),
    count(*)::bigint
  FROM singles_import_queue
  WHERE created_at >= today_start AND created_at < today_end
    AND (genre ILIKE '%dance%' OR genre ILIKE '%house%')
  
  UNION ALL
  
  -- daily-artist-stories-generator -> batch_queue_items (artist_story type)
  SELECT 
    'daily-artist-stories-generator'::text,
    'batch_queue_items'::text,
    max(created_at),
    count(*)::bigint
  FROM batch_queue_items
  WHERE created_at >= today_start AND created_at < today_end
    AND item_type = 'artist_story';
    
END;
$$;