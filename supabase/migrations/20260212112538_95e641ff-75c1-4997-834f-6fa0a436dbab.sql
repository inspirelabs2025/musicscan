CREATE OR REPLACE FUNCTION public.get_user_scan_counts(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, total_scans bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT combined.user_id, SUM(combined.cnt)::bigint AS total_scans
  FROM (
    SELECT a.user_id, COUNT(*) AS cnt FROM ai_scan_results a WHERE a.user_id = ANY(p_user_ids) GROUP BY a.user_id
    UNION ALL
    SELECT c.user_id, COUNT(*) AS cnt FROM cd_scan c WHERE c.user_id = ANY(p_user_ids) GROUP BY c.user_id
    UNION ALL
    SELECT v.user_id, COUNT(*) AS cnt FROM vinyl2_scan v WHERE v.user_id = ANY(p_user_ids) GROUP BY v.user_id
  ) combined
  GROUP BY combined.user_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = 'public';