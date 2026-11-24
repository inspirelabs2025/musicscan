DO $$
DECLARE r record; def text; pos int; body text;
  names text[] := ARRAY['get_admin_scan_stats','get_all_queue_stats','get_analytics_overview','get_clean_analytics_countries','get_clean_analytics_datacenters','get_clean_analytics_devices','get_clean_analytics_hourly','get_clean_analytics_sources','get_clean_analytics_stats','get_content_category_stats','get_cronjob_health_stats','get_cronjob_last_output','get_cronjob_output_stats','get_cronjob_queue_pending','get_daily_traffic_trend','get_device_breakdown','get_filtered_pageview_stats','get_hourly_traffic','get_output_totals','get_pageview_stats','get_recent_cronjob_executions','get_traffic_sources_stats','get_user_scan_counts'];
BEGIN
  FOR r IN SELECT p.oid, p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = ANY(names)
  LOOP
    def := pg_get_functiondef(r.oid);
    pos := position('$function$' in def);
    body := substr(def, pos);
    IF body ~* 'admin_guard' THEN CONTINUE; END IF;
    body := regexp_replace(body, '\mBEGIN\M',
      E'BEGIN\n  -- admin_guard: signed-in non-admins may not read admin statistics\n  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION ''Alleen voor beheerders'' USING ERRCODE = ''42501'';\n  END IF;', 'i');
    EXECUTE substr(def, 1, pos - 1) || body;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;