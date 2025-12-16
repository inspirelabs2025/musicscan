-- Fix get_cronjob_output_stats with correct column names for each table
DROP FUNCTION IF EXISTS get_cronjob_output_stats(date, date);

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
  SELECT * FROM (
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
      COUNT(*) FILTER (WHERE is_active = true)::bigint,
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
      COUNT(*) FILTER (WHERE published_at IS NOT NULL)::bigint,
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
      COUNT(*)::bigint,
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
    
    -- Facebook Posts (Music History) - uses scheduled_time
    SELECT 
      'fb_music_history'::text,
      COALESCE(posted_at, scheduled_time)::date,
      COUNT(*)::bigint,
      COUNT(*) FILTER (WHERE status = 'posted')::bigint,
      COUNT(*) FILTER (WHERE status = 'failed')::bigint
    FROM music_history_facebook_queue
    WHERE COALESCE(posted_at, scheduled_time)::date BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(posted_at, scheduled_time)::date
    
    UNION ALL
    
    -- Facebook Posts (Singles) - uses scheduled_for
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
    
    -- Facebook Posts (YouTube) - uses scheduled_time
    SELECT 
      'fb_youtube'::text,
      COALESCE(posted_at, scheduled_time)::date,
      COUNT(*)::bigint,
      COUNT(*) FILTER (WHERE status = 'posted')::bigint,
      COUNT(*) FILTER (WHERE status = 'failed')::bigint
    FROM youtube_facebook_queue
    WHERE COALESCE(posted_at, scheduled_time)::date BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(posted_at, scheduled_time)::date
  ) subquery
  ORDER BY date_bucket DESC, content_type;
END;
$$;