-- Function to get cronjob output statistics from result tables (not execution log)
CREATE OR REPLACE FUNCTION get_cronjob_output_stats(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  content_type text,
  date_bucket date,
  items_created bigint,
  items_posted bigint,
  items_failed bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  
  -- Artist Stories
  SELECT 
    'artist_stories'::text as content_type,
    created_at::date as date_bucket,
    COUNT(*)::bigint as items_created,
    COUNT(*) FILTER (WHERE is_published = true)::bigint as items_posted,
    0::bigint as items_failed
  FROM artist_stories
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY created_at::date
  
  UNION ALL
  
  -- Music Stories (Singles)
  SELECT 
    'music_stories'::text,
    created_at::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE is_published = true)::bigint,
    0::bigint
  FROM music_stories
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY created_at::date
  
  UNION ALL
  
  -- Anecdotes
  SELECT 
    'music_anecdotes'::text,
    created_at::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE is_published = true)::bigint,
    0::bigint
  FROM music_anecdotes
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY created_at::date
  
  UNION ALL
  
  -- News Blog Posts
  SELECT 
    'news_blog_posts'::text,
    created_at::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE is_published = true)::bigint,
    0::bigint
  FROM news_blog_posts
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY created_at::date
  
  UNION ALL
  
  -- Music History Events
  SELECT 
    'music_history_events'::text,
    created_at::date,
    COUNT(*)::bigint,
    COUNT(*)::bigint, -- All events are considered "posted"
    0::bigint
  FROM music_history_events
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY created_at::date
  
  UNION ALL
  
  -- Platform Products
  SELECT 
    'platform_products'::text,
    created_at::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status = 'active' AND published_at IS NOT NULL)::bigint,
    0::bigint
  FROM platform_products
  WHERE created_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY created_at::date
  
  UNION ALL
  
  -- IndexNow Submissions
  SELECT 
    'indexnow_submissions'::text,
    submitted_at::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status_code = 200)::bigint,
    COUNT(*) FILTER (WHERE status_code IS NOT NULL AND status_code != 200)::bigint
  FROM indexnow_submissions
  WHERE submitted_at::date BETWEEN p_start_date AND p_end_date
  GROUP BY submitted_at::date
  
  UNION ALL
  
  -- Facebook Posts (Music History)
  SELECT 
    'fb_music_history'::text,
    COALESCE(posted_at, scheduled_for)::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status = 'posted')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint
  FROM music_history_facebook_queue
  WHERE COALESCE(posted_at, scheduled_for)::date BETWEEN p_start_date AND p_end_date
  GROUP BY COALESCE(posted_at, scheduled_for)::date
  
  UNION ALL
  
  -- Facebook Posts (Singles)
  SELECT 
    'fb_singles'::text,
    COALESCE(posted_at, scheduled_for)::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status = 'posted')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint
  FROM singles_facebook_queue
  WHERE COALESCE(posted_at, scheduled_for)::date BETWEEN p_start_date AND p_end_date
  GROUP BY COALESCE(posted_at, scheduled_for)::date
  
  UNION ALL
  
  -- Facebook Posts (YouTube)
  SELECT 
    'fb_youtube'::text,
    COALESCE(posted_at, scheduled_for)::date,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status = 'posted')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint
  FROM youtube_facebook_queue
  WHERE COALESCE(posted_at, scheduled_for)::date BETWEEN p_start_date AND p_end_date
  GROUP BY COALESCE(posted_at, scheduled_for)::date
  
  ORDER BY date_bucket DESC, content_type;
END;
$$;

-- Function to get comprehensive queue health for all queues
CREATE OR REPLACE FUNCTION get_all_queue_stats()
RETURNS TABLE (
  queue_name text,
  pending bigint,
  processing bigint,
  completed bigint,
  failed bigint,
  oldest_pending_at timestamptz,
  last_activity timestamptz,
  items_per_hour numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  
  -- Batch Queue Items
  SELECT 
    'batch_queue_items'::text,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint,
    MIN(created_at) FILTER (WHERE status = 'pending'),
    MAX(updated_at),
    ROUND(COUNT(*) FILTER (WHERE status = 'completed' AND processed_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM batch_queue_items
  
  UNION ALL
  
  -- Singles Import Queue
  SELECT 
    'singles_import_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint,
    MIN(created_at) FILTER (WHERE status = 'pending'),
    MAX(processed_at),
    ROUND(COUNT(*) FILTER (WHERE status = 'completed' AND processed_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM singles_import_queue
  
  UNION ALL
  
  -- Singles Facebook Queue
  SELECT 
    'singles_facebook_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint,
    COUNT(*) FILTER (WHERE status = 'posted')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint,
    MIN(created_at) FILTER (WHERE status = 'pending'),
    MAX(posted_at),
    ROUND(COUNT(*) FILTER (WHERE status = 'posted' AND posted_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM singles_facebook_queue
  
  UNION ALL
  
  -- Music History Facebook Queue
  SELECT 
    'music_history_facebook_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint,
    COUNT(*) FILTER (WHERE status = 'posted')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint,
    MIN(created_at) FILTER (WHERE status = 'pending'),
    MAX(posted_at),
    ROUND(COUNT(*) FILTER (WHERE status = 'posted' AND posted_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM music_history_facebook_queue
  
  UNION ALL
  
  -- YouTube Facebook Queue
  SELECT 
    'youtube_facebook_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint,
    COUNT(*) FILTER (WHERE status = 'posted')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint,
    MIN(created_at) FILTER (WHERE status = 'pending'),
    MAX(posted_at),
    ROUND(COUNT(*) FILTER (WHERE status = 'posted' AND posted_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM youtube_facebook_queue
  
  UNION ALL
  
  -- IndexNow Queue
  SELECT 
    'indexnow_queue'::text,
    COUNT(*) FILTER (WHERE processed = false)::bigint,
    0::bigint,
    COUNT(*) FILTER (WHERE processed = true)::bigint,
    0::bigint,
    MIN(created_at) FILTER (WHERE processed = false),
    MAX(processed_at),
    ROUND(COUNT(*) FILTER (WHERE processed = true AND processed_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM indexnow_queue
  
  UNION ALL
  
  -- Photo Batch Queue
  SELECT 
    'photo_batch_queue'::text,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint,
    MIN(created_at) FILTER (WHERE status = 'pending'),
    MAX(updated_at),
    ROUND(COUNT(*) FILTER (WHERE status = 'completed' AND updated_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM photo_batch_queue
  
  UNION ALL
  
  -- Render Jobs
  SELECT 
    'render_jobs'::text,
    COUNT(*) FILTER (WHERE status IN ('pending', 'queued'))::bigint,
    COUNT(*) FILTER (WHERE status IN ('running', 'processing'))::bigint,
    COUNT(*) FILTER (WHERE status IN ('completed', 'done'))::bigint,
    COUNT(*) FILTER (WHERE status IN ('failed', 'error'))::bigint,
    MIN(created_at) FILTER (WHERE status IN ('pending', 'queued')),
    MAX(completed_at),
    ROUND(COUNT(*) FILTER (WHERE status IN ('completed', 'done') AND completed_at > now() - interval '24 hours')::numeric / 24, 1)
  FROM render_jobs
  
  ORDER BY pending DESC;
END;
$$;

-- Function to get output totals per content type for a date range
CREATE OR REPLACE FUNCTION get_output_totals(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  content_type text,
  label text,
  total_created bigint,
  total_posted bigint,
  total_failed bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.content_type,
    CASE os.content_type
      WHEN 'artist_stories' THEN 'Artist Stories'
      WHEN 'music_stories' THEN 'Singles'
      WHEN 'music_anecdotes' THEN 'Anekdotes'
      WHEN 'news_blog_posts' THEN 'Nieuws'
      WHEN 'music_history_events' THEN 'Muziekgeschiedenis'
      WHEN 'platform_products' THEN 'Producten'
      WHEN 'indexnow_submissions' THEN 'IndexNow'
      WHEN 'fb_music_history' THEN 'FB Muziekgeschiedenis'
      WHEN 'fb_singles' THEN 'FB Singles'
      WHEN 'fb_youtube' THEN 'FB YouTube'
      ELSE os.content_type
    END as label,
    COALESCE(SUM(os.items_created), 0)::bigint,
    COALESCE(SUM(os.items_posted), 0)::bigint,
    COALESCE(SUM(os.items_failed), 0)::bigint
  FROM get_cronjob_output_stats(p_start_date, p_end_date) os
  GROUP BY os.content_type
  ORDER BY COALESCE(SUM(os.items_created), 0) DESC;
END;
$$;