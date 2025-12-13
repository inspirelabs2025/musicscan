
-- Insert published episodes into queue for first-time posting
INSERT INTO public.podcast_facebook_queue (episode_id, podcast_id, post_type, scheduled_for, status)
SELECT 
  e.id,
  e.podcast_id,
  'scheduled_rotation',
  now() + (row_number() OVER (ORDER BY e.created_at) * interval '2 hours'),
  'pending'
FROM public.own_podcast_episodes e
WHERE e.is_published = true
AND NOT EXISTS (
  SELECT 1 FROM public.podcast_facebook_queue q WHERE q.episode_id = e.id
)
ON CONFLICT DO NOTHING;

-- Schedule the weekly podcast rotation (Mondays at 6 AM UTC)
SELECT cron.schedule(
  'schedule-weekly-podcast-posts',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/schedule-weekly-podcast-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNjI2MDAsImV4cCI6MjA0ODczODYwMH0.LwYhLgSHk2c5MqEPBVRoJKGNPNqJnXtWmCF-6R3cevk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule the hourly queue processor (every hour from 8 AM to 10 PM UTC)
SELECT cron.schedule(
  'process-podcast-facebook-queue',
  '0 8-22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/process-podcast-facebook-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNjI2MDAsImV4cCI6MjA0ODczODYwMH0.LwYhLgSHk2c5MqEPBVRoJKGNPNqJnXtWmCF-6R3cevk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
