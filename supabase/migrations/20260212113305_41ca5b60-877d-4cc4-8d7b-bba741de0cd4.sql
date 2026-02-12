
CREATE OR REPLACE FUNCTION public.get_admin_scan_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_scans', (
      SELECT COALESCE(SUM(cnt), 0) FROM (
        SELECT COUNT(*) as cnt FROM ai_scan_results
        UNION ALL SELECT COUNT(*) FROM cd_scan
        UNION ALL SELECT COUNT(*) FROM vinyl2_scan
      ) t
    ),
    'ai_scans_total', (SELECT COUNT(*) FROM ai_scan_results),
    'ai_scans_completed', (SELECT COUNT(*) FROM ai_scan_results WHERE status = 'completed'),
    'ai_scans_failed', (SELECT COUNT(*) FROM ai_scan_results WHERE status = 'failed'),
    'ai_scans_no_match', (SELECT COUNT(*) FROM ai_scan_results WHERE status = 'no_exact_match'),
    'ai_scans_pending', (SELECT COUNT(*) FROM ai_scan_results WHERE status = 'pending' OR status = 'processing'),
    'cd_scans_total', (SELECT COUNT(*) FROM cd_scan),
    'vinyl_scans_total', (SELECT COUNT(*) FROM vinyl2_scan),
    'unique_scanners', (
      SELECT COUNT(DISTINCT user_id) FROM (
        SELECT user_id FROM ai_scan_results
        UNION SELECT user_id FROM cd_scan
        UNION SELECT user_id FROM vinyl2_scan
      ) t
    ),
    'scans_today', (
      SELECT COALESCE(SUM(cnt), 0) FROM (
        SELECT COUNT(*) as cnt FROM ai_scan_results WHERE created_at >= CURRENT_DATE
        UNION ALL SELECT COUNT(*) FROM cd_scan WHERE created_at >= CURRENT_DATE
        UNION ALL SELECT COUNT(*) FROM vinyl2_scan WHERE created_at >= CURRENT_DATE
      ) t
    ),
    'scans_this_week', (
      SELECT COALESCE(SUM(cnt), 0) FROM (
        SELECT COUNT(*) as cnt FROM ai_scan_results WHERE created_at >= date_trunc('week', CURRENT_DATE)
        UNION ALL SELECT COUNT(*) FROM cd_scan WHERE created_at >= date_trunc('week', CURRENT_DATE)
        UNION ALL SELECT COUNT(*) FROM vinyl2_scan WHERE created_at >= date_trunc('week', CURRENT_DATE)
      ) t
    ),
    'scans_this_month', (
      SELECT COALESCE(SUM(cnt), 0) FROM (
        SELECT COUNT(*) as cnt FROM ai_scan_results WHERE created_at >= date_trunc('month', CURRENT_DATE)
        UNION ALL SELECT COUNT(*) FROM cd_scan WHERE created_at >= date_trunc('month', CURRENT_DATE)
        UNION ALL SELECT COUNT(*) FROM vinyl2_scan WHERE created_at >= date_trunc('month', CURRENT_DATE)
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
