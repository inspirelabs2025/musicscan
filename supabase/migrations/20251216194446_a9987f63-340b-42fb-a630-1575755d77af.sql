-- Update get_cronjob_last_output to include daily-artist-stories-generator
CREATE OR REPLACE FUNCTION public.get_cronjob_last_output(today_start timestamp with time zone, today_end timestamp with time zone)
 RETURNS TABLE(function_name text, source_table text, last_output_at timestamp with time zone, items_today bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  
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
  
  -- artist-stories-batch-processor -> artist_stories
  SELECT 
    'artist-stories-batch-processor'::text,
    'artist_stories'::text,
    max(created_at),
    count(*)::bigint
  FROM artist_stories
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- daily-artist-stories-generator -> batch_queue_items (artist_story items created today)
  SELECT 
    'daily-artist-stories-generator'::text,
    'batch_queue_items'::text,
    max(created_at),
    count(*)::bigint
  FROM batch_queue_items
  WHERE created_at >= today_start AND created_at < today_end
    AND item_type = 'artist_story'
  
  UNION ALL
  
  -- singles-batch-processor -> music_stories (singles)
  SELECT 
    'singles-batch-processor'::text,
    'music_stories'::text,
    max(created_at),
    count(*)::bigint
  FROM music_stories
  WHERE created_at >= today_start AND created_at < today_end
    AND single_name IS NOT NULL
  
  UNION ALL
  
  -- process-spotify-new-releases -> spotify_new_releases_processed
  SELECT 
    'process-spotify-new-releases'::text,
    'spotify_new_releases_processed'::text,
    max(created_at),
    count(*)::bigint
  FROM spotify_new_releases_processed
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- post-scheduled-music-history -> facebook_post_log
  SELECT 
    'post-scheduled-music-history'::text,
    'facebook_post_log'::text,
    max(posted_at),
    count(*)::bigint
  FROM facebook_post_log
  WHERE posted_at >= today_start AND posted_at < today_end
    AND content_type = 'music_history'
  
  UNION ALL
  
  -- post-scheduled-youtube -> facebook_post_log
  SELECT 
    'post-scheduled-youtube'::text,
    'facebook_post_log'::text,
    max(posted_at),
    count(*)::bigint
  FROM facebook_post_log
  WHERE posted_at >= today_start AND posted_at < today_end
    AND content_type = 'youtube'
  
  UNION ALL
  
  -- post-scheduled-singles -> facebook_post_log
  SELECT 
    'post-scheduled-singles'::text,
    'facebook_post_log'::text,
    max(posted_at),
    count(*)::bigint
  FROM facebook_post_log
  WHERE posted_at >= today_start AND posted_at < today_end
    AND content_type IN ('single', 'singles')
  
  UNION ALL
  
  -- photo-batch-processor -> platform_products
  SELECT 
    'photo-batch-processor'::text,
    'platform_products'::text,
    max(created_at),
    count(*)::bigint
  FROM platform_products
  WHERE created_at >= today_start AND created_at < today_end
  
  UNION ALL
  
  -- christmas-batch-processor -> christmas_import_queue (completed)
  SELECT 
    'christmas-batch-processor'::text,
    'christmas_import_queue'::text,
    max(processed_at),
    count(*)::bigint
  FROM christmas_import_queue
  WHERE processed_at >= today_start AND processed_at < today_end
    AND status = 'completed';
    
END;
$function$;