-- Emergency stop (continued): remove ALL remaining pg_cron jobs
DO $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT jobid FROM cron.job) LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END $$;