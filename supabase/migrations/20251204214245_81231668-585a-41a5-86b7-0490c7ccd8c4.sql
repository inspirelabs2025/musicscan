-- Fix laatste 4 functions met mutable search path
ALTER FUNCTION public.queue_sitemap_regeneration() SET search_path = public;
ALTER FUNCTION public.update_poster_queue_updated_at() SET search_path = public;
ALTER FUNCTION public.update_quiz_leaderboard() SET search_path = public;
ALTER FUNCTION public.update_updated_at_subscription_tables() SET search_path = public;