-- Step 1: Clean up duplicate cron jobs
DO $$
DECLARE
  job_record RECORD;
BEGIN
  FOR job_record IN 
    SELECT jobid, jobname 
    FROM cron.job 
    WHERE jobname LIKE '%daily-news%'
  LOOP
    PERFORM cron.unschedule(job_record.jobid);
    RAISE NOTICE 'Unscheduled job: % (ID: %)', job_record.jobname, job_record.jobid;
  END LOOP;
END $$;

-- Step 2: Create single daily cron job for news updates
SELECT cron.schedule(
  'daily-news-update-single',
  '0 8 * * *', -- Every day at 08:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/daily-news-update',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Step 3: Create news generation logs table
CREATE TABLE IF NOT EXISTS public.news_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL,
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read logs
CREATE POLICY "News generation logs are viewable by everyone"
ON public.news_generation_logs
FOR SELECT
TO public
USING (true);

-- Policy: Only authenticated users can insert logs
CREATE POLICY "Authenticated users can create logs"
ON public.news_generation_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_news_logs_created_at ON public.news_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_logs_source ON public.news_generation_logs(source);