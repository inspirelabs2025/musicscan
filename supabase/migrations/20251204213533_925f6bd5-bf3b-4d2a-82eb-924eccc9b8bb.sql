-- Fix unified_scans view als normale view
DROP VIEW IF EXISTS public.unified_scans;

-- Verwijder vorige policy die is aangemaakt
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;

-- Profiles: eigenaar ziet alles, anderen alleen publieke profielen
CREATE POLICY "Owner can view full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public profiles viewable by authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (is_public = true);

-- Fix resterende functions zonder search_path
ALTER FUNCTION public.auto_post_blog_to_facebook() SET search_path = public;
ALTER FUNCTION public.trigger_auto_blog_generation() SET search_path = public;

-- Revoke API access to materialized views (they should only be accessed internally)
REVOKE ALL ON public.featured_photos FROM anon, authenticated;
REVOKE ALL ON public.notification_stats FROM anon, authenticated;