-- Function to get last output per cronjob from actual content tables
CREATE OR REPLACE FUNCTION public.get_cronjob_last_output()
RETURNS TABLE (
  cronjob_name text,
  output_table text,
  last_output_at timestamptz,
  items_today bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  today_start timestamptz := date_trunc('day', now());
BEGIN
  RETURN QUERY
  
  -- daily-anecdote-generator → music_anecdotes
  SELECT 
    'daily-anecdote-generator'::text,
    'music_anecdotes'::text,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at >= today_start)
  FROM music_anecdotes
  
  UNION ALL
  
  -- artist-stories-batch-processor → artist_stories
  SELECT 
    'artist-stories-batch-processor'::text,
    'artist_stories'::text,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at >= today_start)
  FROM artist_stories
  
  UNION ALL
  
  -- singles-batch-processor → music_stories (singles)
  SELECT 
    'singles-batch-processor'::text,
    'music_stories'::text,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at >= today_start)
  FROM music_stories WHERE single_name IS NOT NULL
  
  UNION ALL
  
  -- generate-music-history → music_history_events
  SELECT 
    'generate-music-history'::text,
    'music_history_events'::text,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at >= today_start)
  FROM music_history_events
  
  UNION ALL
  
  -- process-spotify-new-releases → spotify_new_releases_processed
  SELECT 
    'process-spotify-new-releases'::text,
    'spotify_new_releases_processed'::text,
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at >= today_start)
  FROM spotify_new_releases_processed
  
  UNION ALL
  
  -- post-scheduled-music-history → music_history_facebook_queue (posted)
  SELECT 
    'post-scheduled-music-history'::text,
    'music_history_facebook_queue'::text,
    MAX(posted_at),
    COUNT(*) FILTER (WHERE posted_at >= today_start)
  FROM music_history_facebook_queue WHERE status = 'posted'
  
  UNION ALL
  
  -- post-scheduled-singles-cron → singles_facebook_queue (posted)
  SELECT 
    'post-scheduled-singles-cron'::text,
    'singles_facebook_queue'::text,
    MAX(posted_at),
    COUNT(*) FILTER (WHERE posted_at >= today_start)
  FROM singles_facebook_queue WHERE status = 'posted'
  
  UNION ALL
  
  -- post-scheduled-youtube → youtube_facebook_queue (posted)
  SELECT 
    'post-scheduled-youtube'::text,
    'youtube_facebook_queue'::text,
    MAX(posted_at),
    COUNT(*) FILTER (WHERE posted_at >= today_start)
  FROM youtube_facebook_queue WHERE status = 'posted'
  
  UNION ALL
  
  -- indexnow-submit → indexnow_queue (processed)
  SELECT 
    'indexnow-submit'::text,
    'indexnow_queue'::text,
    MAX(processed_at),
    COUNT(*) FILTER (WHERE processed_at >= today_start)
  FROM indexnow_queue WHERE processed = true
  
  UNION ALL
  
  -- photo-batch-processor → photo_batch_queue
  SELECT 
    'photo-batch-processor'::text,
    'photo_batch_queue'::text,
    MAX(updated_at),
    COUNT(*) FILTER (WHERE updated_at >= today_start AND status = 'completed')
  FROM photo_batch_queue
  
  UNION ALL
  
  -- render-job-processor → render_jobs
  SELECT 
    'render-job-processor'::text,
    'render_jobs'::text,
    MAX(completed_at),
    COUNT(*) FILTER (WHERE completed_at >= today_start)
  FROM render_jobs WHERE status = 'completed';
END;
$$;