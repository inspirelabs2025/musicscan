DO $$
DECLARE existing_job int;
BEGIN
  SELECT jobid INTO existing_job
  FROM cron.job
  WHERE jobname = 'ms_fill_missing_discogs_ids';

  IF existing_job IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job);
  END IF;

  PERFORM cron.schedule(
    'ms_fill_missing_discogs_ids',
    '* * * * *',
    $cmd$
      SELECT net.http_post(
        url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/fill-missing-discogs-ids',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{"batchSize": 15, "minScore": 75}'::jsonb
      ) AS request_id;
    $cmd$
  );
END $$;