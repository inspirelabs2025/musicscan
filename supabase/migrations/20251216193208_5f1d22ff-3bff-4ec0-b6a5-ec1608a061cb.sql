CREATE OR REPLACE FUNCTION public.get_cronjob_queue_pending()
 RETURNS TABLE(cronjob_name text, queue_table text, pending_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 'artist-stories-batch-processor'::text, 'batch_queue_items'::text,
    (SELECT COUNT(*) FROM batch_queue_items WHERE status = 'pending' AND item_type = 'artist_story')::bigint
  UNION ALL
  SELECT 'singles-batch-processor'::text, 'singles_import_queue'::text,
    (SELECT COUNT(*) FROM singles_import_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'post-scheduled-singles'::text, 'singles_facebook_queue'::text,
    (SELECT COUNT(*) FROM singles_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'post-scheduled-music-history'::text, 'music_history_facebook_queue'::text,
    (SELECT COUNT(*) FROM music_history_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'post-scheduled-youtube'::text, 'youtube_facebook_queue'::text,
    (SELECT COUNT(*) FROM youtube_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'process-podcast-facebook-queue'::text, 'podcast_facebook_queue'::text,
    (SELECT COUNT(*) FROM podcast_facebook_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'indexnow-processor'::text, 'indexnow_queue'::text,
    (SELECT COUNT(*) FROM indexnow_queue WHERE processed = false)::bigint
  UNION ALL
  SELECT 'process-discogs-queue'::text, 'discogs_import_log'::text,
    (SELECT COUNT(*) FROM discogs_import_log WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'bulk-poster-processor'::text, 'photo_batch_queue'::text,
    (SELECT COUNT(*) FROM photo_batch_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'process-tiktok-video-queue'::text, 'render_jobs'::text,
    (SELECT COUNT(*) FROM render_jobs WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'top2000-auto-processor'::text, 'top2000_songs'::text,
    (SELECT COUNT(*) FROM top2000_songs WHERE enriched_at IS NULL)::bigint
  UNION ALL
  SELECT 'backfill-christmas-socks'::text, 'christmas_import_queue'::text,
    (SELECT COUNT(*) FROM christmas_import_queue WHERE status = 'pending')::bigint
  UNION ALL
  SELECT 'composer-batch-processor'::text, 'batch_queue_items'::text,
    (SELECT COUNT(*) FROM batch_queue_items WHERE status = 'pending' AND item_type = 'composer')::bigint
  UNION ALL
  SELECT 'soundtrack-batch-processor'::text, 'batch_queue_items'::text,
    (SELECT COUNT(*) FROM batch_queue_items WHERE status = 'pending' AND item_type = 'soundtrack')::bigint
  UNION ALL
  SELECT 'queue-dance-house-content'::text, 'singles_import_queue'::text,
    (SELECT COUNT(*) FROM singles_import_queue WHERE status = 'pending' AND (genre ILIKE '%electronic%' OR genre ILIKE '%dance%' OR genre ILIKE '%house%'))::bigint
  UNION ALL
  SELECT 'process-spotify-new-releases'::text, 'spotify_new_releases_processed'::text,
    (SELECT COUNT(*) FROM spotify_new_releases_processed WHERE status = 'pending')::bigint;
END;
$function$;