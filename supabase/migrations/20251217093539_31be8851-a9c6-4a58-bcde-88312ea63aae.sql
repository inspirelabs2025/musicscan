-- Create cron job for LLM sitemap generation (daily at 04:00 UTC)
SELECT cron.schedule(
  'generate-llm-sitemap',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/generate-llm-sitemap',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MDcyMTYsImV4cCI6MjA0ODI4MzIxNn0.bneNq5E8E-OQqTYZmkj6RLB8lXthqmRTUyN-MyhOsos"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);