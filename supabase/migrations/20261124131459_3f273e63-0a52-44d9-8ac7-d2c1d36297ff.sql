DO $$
DECLARE r record;
  keep text[] := ARRAY['has_role','is_admin','is_conversation_participant','claim_render_job','complete_render_job','fail_render_job',
    'check_usage_limit','find_or_create_artist_fanwall','get_admin_scan_stats','get_all_queue_stats','get_analytics_overview',
    'get_clean_analytics_countries','get_clean_analytics_datacenters','get_clean_analytics_devices','get_clean_analytics_hourly',
    'get_clean_analytics_sources','get_clean_analytics_stats','get_content_category_stats','get_cronjob_health_stats','get_cronjob_last_output',
    'get_cronjob_output_stats','get_cronjob_queue_pending','get_current_usage','get_daily_traffic_trend','get_device_breakdown',
    'get_filtered_pageview_stats','get_hourly_traffic','get_output_totals','get_pageview_stats','get_price_trend','get_recent_cronjob_executions',
    'get_traffic_sources_stats','get_user_scan_counts','increment_product_view','increment_shop_view_count','increment_usage',
    'insert_admin_alert_if_new','redeem_promo_code','generate_product_slug','get_shop_category_counts','get_public_user_stats','increment_popup_stat'];
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.prosecdef AND NOT (p.proname = ANY(keep))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;