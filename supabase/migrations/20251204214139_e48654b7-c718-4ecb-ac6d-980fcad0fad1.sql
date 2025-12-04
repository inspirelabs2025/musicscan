-- Add RLS policies voor sitemap_logs en comment_generation_stats
CREATE POLICY "Admins can manage sitemap_logs"
ON public.sitemap_logs FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage comment_generation_stats"
ON public.comment_generation_stats FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Fix resterende functions met mutable search path
ALTER FUNCTION public.auto_generate_shop_slug() SET search_path = public;
ALTER FUNCTION public.auto_post_news_to_facebook() SET search_path = public;
ALTER FUNCTION public.auto_send_order_confirmation() SET search_path = public;
ALTER FUNCTION public.auto_send_order_delivered() SET search_path = public;
ALTER FUNCTION public.auto_send_order_shipped() SET search_path = public;
ALTER FUNCTION public.extract_discogs_id_from_url(text) SET search_path = public;