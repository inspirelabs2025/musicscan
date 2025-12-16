-- Fix schedule-music-history-posts to use correct column name scheduled_time
CREATE OR REPLACE FUNCTION public.get_cronjob_last_output()
 RETURNS TABLE(cronjob_name text, output_table text, last_output_at timestamp with time zone, items_today bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- christmas-batch-processor -> christmas_import_queue (processed today)
  SELECT 
    'christmas-batch-processor'::text,
    'christmas_import_queue'::text,
    max(processed_at),
    count(*)::bigint
  FROM christmas_import_queue
  WHERE processed_at >= today_start AND processed_at < today_end
    AND status = 'completed'
  
  UNION ALL
  
  -- enrich-top2000-songs -> top2000_songs (enriched today)
  SELECT 
    'enrich-top2000-songs'::text,
    'top2000_songs'::text,
    max(enriched_at),
    count(*)::bigint
  FROM top2000_songs
  WHERE enriched_at >= today_start AND enriched_at < today_end
  
  UNION ALL
  
  -- top2000-auto-processor -> top2000_entries (processed today)
  SELECT 
    'top2000-auto-processor'::text,
    'top2000_entries'::text,
    max(created_at),
    count(*)::bigint
  FROM top2000_entries
  WHERE created_at >= today_start AND created_at < today_end
  
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
  
  -- photo-batch-processor -> photo_batch_queue (completed today)
  SELECT 
    'photo-batch-processor'::text,
    'photo_batch_queue'::text,
    max(updated_at),
    count(*)::bigint
  FROM photo_batch_queue
  WHERE updated_at >= today_start AND updated_at < today_end
    AND status = 'completed'
  
  UNION ALL
  
  -- post-daily-quiz-facebook -> daily_quiz_facebook_queue (posted today)
  SELECT 
    'post-daily-quiz-facebook'::text,
    'daily_quiz_facebook_queue'::text,
    max(posted_at),
    count(*)::bigint
  FROM daily_quiz_facebook_queue
  WHERE posted_at >= today_start AND posted_at < today_end
    AND status = 'posted';
    
END;
$function$;