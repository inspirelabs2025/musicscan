-- Create function to increment topic views safely
CREATE OR REPLACE FUNCTION public.increment_topic_views(topic_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.forum_topics 
  SET view_count = view_count + 1, updated_at = now()
  WHERE id = topic_id;
END;
$$;

-- Set up cron job for weekly forum discussions (runs every Sunday at 20:00)
SELECT cron.schedule(
  'weekly-forum-discussions',
  '0 20 * * 0', -- Every Sunday at 8 PM
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/weekly-forum-discussions',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);