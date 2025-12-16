-- Update get_cronjob_queue_pending to include daily-artist-stories-generator
CREATE OR REPLACE FUNCTION public.get_cronjob_queue_pending()
 RETURNS TABLE(cronjob_name text, queue_table text, pending_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  
  -- daily-artist-stories-generator -> batch_queue_items (artist_story pending)
  SELECT 
    'daily-artist-stories-generator'::text,
    'batch_queue_items'::text,
    count(*)::bigint
  FROM batch_queue_items
  WHERE status = 'pending' AND item_type = 'artist_story'
  
  UNION ALL
  
  -- artist-stories-batch-processor -> batch_queue_items (artist_story pending)
  SELECT 
    'artist-stories-batch-processor'::text,
    'batch_queue_items'::text,
    count(*)::bigint
  FROM batch_queue_items
  WHERE status = 'pending' AND item_type = 'artist_story'
  
  UNION ALL
  
  -- singles-batch-processor -> singles_import_queue
  SELECT 
    'singles-batch-processor'::text,
    'singles_import_queue'::text,
    count(*)::bigint
  FROM singles_import_queue
  WHERE status = 'pending'
  
  UNION ALL
  
  -- post-scheduled-singles -> singles_facebook_queue
  SELECT 
    'post-scheduled-singles'::text,
    'singles_facebook_queue'::text,
    count(*)::bigint
  FROM singles_facebook_queue
  WHERE status = 'pending'
  
  UNION ALL
  
  -- post-scheduled-music-history -> music_history_facebook_queue
  SELECT 
    'post-scheduled-music-history'::text,
    'music_history_facebook_queue'::text,
    count(*)::bigint
  FROM music_history_facebook_queue
  WHERE status = 'pending'
  
  UNION ALL
  
  -- post-scheduled-youtube -> youtube_facebook_queue
  SELECT 
    'post-scheduled-youtube'::text,
    'youtube_facebook_queue'::text,
    count(*)::bigint
  FROM youtube_facebook_queue
  WHERE status = 'pending'
  
  UNION ALL
  
  -- process-podcast-facebook-queue -> podcast_facebook_queue
  SELECT 
    'process-podcast-facebook-queue'::text,
    'podcast_facebook_queue'::text,
    count(*)::bigint
  FROM podcast_facebook_queue
  WHERE status = 'pending'
  
  UNION ALL
  
  -- indexnow-processor -> indexnow_queue
  SELECT 
    'indexnow-processor'::text,
    'indexnow_queue'::text,
    count(*)::bigint
  FROM indexnow_queue
  WHERE processed = false
  
  UNION ALL
  
  -- process-discogs-queue -> discogs_import_log
  SELECT 
    'process-discogs-queue'::text,
    'discogs_import_log'::text,
    count(*)::bigint
  FROM discogs_import_log
  WHERE status = 'pending'
  
  UNION ALL
  
  -- bulk-poster-processor -> photo_batch_queue
  SELECT 
    'bulk-poster-processor'::text,
    'photo_batch_queue'::text,
    count(*)::bigint
  FROM photo_batch_queue
  WHERE status = 'pending'
  
  UNION ALL
  
  -- process-tiktok-video-queue -> render_jobs
  SELECT 
    'process-tiktok-video-queue'::text,
    'render_jobs'::text,
    count(*)::bigint
  FROM render_jobs
  WHERE status = 'pending'
  
  UNION ALL
  
  -- top2000-auto-processor -> top2000_songs (unenriched)
  SELECT 
    'top2000-auto-processor'::text,
    'top2000_songs'::text,
    count(*)::bigint
  FROM top2000_songs
  WHERE enriched_at IS NULL
  
  UNION ALL
  
  -- backfill-christmas-socks -> christmas_import_queue
  SELECT 
    'backfill-christmas-socks'::text,
    'christmas_import_queue'::text,
    count(*)::bigint
  FROM christmas_import_queue
  WHERE status = 'pending'
  
  UNION ALL
  
  -- composer-batch-processor -> batch_queue_items (composer)
  SELECT 
    'composer-batch-processor'::text,
    'batch_queue_items'::text,
    count(*)::bigint
  FROM batch_queue_items
  WHERE status = 'pending' AND item_type = 'composer'
  
  UNION ALL
  
  -- soundtrack-batch-processor -> batch_queue_items (soundtrack)
  SELECT 
    'soundtrack-batch-processor'::text,
    'batch_queue_items'::text,
    count(*)::bigint
  FROM batch_queue_items
  WHERE status = 'pending' AND item_type = 'soundtrack';
    
END;
$function$;