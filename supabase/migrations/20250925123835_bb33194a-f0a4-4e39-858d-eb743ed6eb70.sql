-- Create RPC function to get public user statistics
CREATE OR REPLACE FUNCTION public.get_public_user_stats()
RETURNS TABLE(
  total_users integer,
  new_users_last_7_days integer,
  new_users_last_30_days integer
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::integer FROM public.profiles WHERE is_public IS TRUE) AS total_users,
    (SELECT count(*)::integer FROM public.profiles WHERE is_public IS TRUE AND created_at >= now() - interval '7 days') AS new_users_last_7_days,
    (SELECT count(*)::integer FROM public.profiles WHERE is_public IS TRUE AND created_at >= now() - interval '30 days') AS new_users_last_30_days;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_public_user_stats() TO anon, authenticated;