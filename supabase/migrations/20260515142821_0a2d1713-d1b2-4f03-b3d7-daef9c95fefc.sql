
-- ============ 1) newsletter_subscribers ============
-- Already admin SELECT/UPDATE/DELETE + public INSERT. Just confirm no public read leaks remain.
-- (no-op; existing policies are correct)

-- ============ 2) platform_orders ============
-- Existing SELECT correctly scopes to customer or admin. ALL admin policy is fine.
-- Drop any permissive insert/update if exists; allow guest INSERT for checkout.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.platform_orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.platform_orders;
CREATE POLICY "Anyone can create orders"
  ON public.platform_orders FOR INSERT
  WITH CHECK (true);

-- ============ 3) photo_batch_queue ============
DROP POLICY IF EXISTS "Authenticated users can view all batch jobs" ON public.photo_batch_queue;
CREATE POLICY "Admins can view all batch jobs"
  ON public.photo_batch_queue FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============ 4) poster_processing_queue ============
DROP POLICY IF EXISTS "Authenticated users can view poster queue" ON public.poster_processing_queue;
DROP POLICY IF EXISTS "Authenticated users can create poster queue items" ON public.poster_processing_queue;
DROP POLICY IF EXISTS "Authenticated users can delete poster queue items" ON public.poster_processing_queue;
DROP POLICY IF EXISTS "System can update poster queue" ON public.poster_processing_queue;
CREATE POLICY "Admins manage poster processing queue"
  ON public.poster_processing_queue FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 5) release_enrichments ============
DROP POLICY IF EXISTS "Authenticated users can insert enrichments" ON public.release_enrichments;
DROP POLICY IF EXISTS "Authenticated users can update enrichments" ON public.release_enrichments;
CREATE POLICY "Admins can insert enrichments"
  ON public.release_enrichments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update enrichments"
  ON public.release_enrichments FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 6) releases ============
DROP POLICY IF EXISTS "Authenticated users can create releases" ON public.releases;
DROP POLICY IF EXISTS "Authenticated users can update releases" ON public.releases;
CREATE POLICY "Admins can create releases"
  ON public.releases FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update releases"
  ON public.releases FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 7) artist_fanwalls ============
DROP POLICY IF EXISTS "Authenticated users can create artist fanwalls" ON public.artist_fanwalls;
DROP POLICY IF EXISTS "Authenticated users can update artist fanwalls" ON public.artist_fanwalls;
CREATE POLICY "Admins can create artist fanwalls"
  ON public.artist_fanwalls FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update artist fanwalls"
  ON public.artist_fanwalls FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 8) blog_context ============
DROP POLICY IF EXISTS "Authenticated users can create blog context" ON public.blog_context;
DROP POLICY IF EXISTS "Authenticated users can update blog context" ON public.blog_context;
CREATE POLICY "Admins can create blog context"
  ON public.blog_context FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update blog context"
  ON public.blog_context FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 9) time_machine_events ============
DROP POLICY IF EXISTS "Authenticated users can create time machine events" ON public.time_machine_events;
DROP POLICY IF EXISTS "Authenticated users can update time machine events" ON public.time_machine_events;
DROP POLICY IF EXISTS "Authenticated users can delete time machine events" ON public.time_machine_events;
CREATE POLICY "Admins can create time machine events"
  ON public.time_machine_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update time machine events"
  ON public.time_machine_events FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete time machine events"
  ON public.time_machine_events FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============ 10) spotify_individual_episodes ============
DROP POLICY IF EXISTS "Authenticated users can create individual episodes" ON public.spotify_individual_episodes;
DROP POLICY IF EXISTS "Authenticated users can update individual episodes" ON public.spotify_individual_episodes;
DROP POLICY IF EXISTS "Authenticated users can delete individual episodes" ON public.spotify_individual_episodes;
CREATE POLICY "Admins manage individual episodes"
  ON public.spotify_individual_episodes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 11) spotify_curated_shows ============
DROP POLICY IF EXISTS "Authenticated users can manage curated shows" ON public.spotify_curated_shows;
CREATE POLICY "Admins manage curated shows"
  ON public.spotify_curated_shows FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 12) spotify_show_episodes ============
DROP POLICY IF EXISTS "Authenticated users can manage show episodes" ON public.spotify_show_episodes;
CREATE POLICY "Admins manage show episodes"
  ON public.spotify_show_episodes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 13) discogs_releases_shown ============
DROP POLICY IF EXISTS "Authenticated users can insert discogs releases shown" ON public.discogs_releases_shown;
DROP POLICY IF EXISTS "Authenticated users can update discogs releases shown" ON public.discogs_releases_shown;
CREATE POLICY "Admins can insert discogs releases shown"
  ON public.discogs_releases_shown FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update discogs releases shown"
  ON public.discogs_releases_shown FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ 14) Social-posting queues & logs (drop public USING true; service_role bypasses RLS) ============
DROP POLICY IF EXISTS "Service role can manage album_facebook_queue" ON public.album_facebook_queue;
DROP POLICY IF EXISTS "Service role can manage daily quiz queue" ON public.daily_quiz_facebook_queue;
DROP POLICY IF EXISTS "Service role has full access to facebook_post_log" ON public.facebook_post_log;
DROP POLICY IF EXISTS "Service role can manage instagram_post_log" ON public.instagram_post_log;
DROP POLICY IF EXISTS "Allow service role full access to music history queue" ON public.music_history_facebook_queue;
DROP POLICY IF EXISTS "Allow public read access to music history queue" ON public.music_history_facebook_queue;
DROP POLICY IF EXISTS "Allow system to manage news cache" ON public.news_cache;
DROP POLICY IF EXISTS "System can manage import queue" ON public.christmas_import_queue;
DROP POLICY IF EXISTS "System can manage studio facebook queue" ON public.studio_facebook_queue;
DROP POLICY IF EXISTS "System can manage TikTok video queue" ON public.tiktok_video_queue;
DROP POLICY IF EXISTS "Service role has full access to worker_stats" ON public.worker_stats;
DROP POLICY IF EXISTS "Service role full access" ON public.youtube_facebook_queue;
DROP POLICY IF EXISTS "Service role can insert threads posts" ON public.threads_post_log;

-- Add admin manage policies (service_role bypasses RLS regardless)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'album_facebook_queue','daily_quiz_facebook_queue','facebook_post_log',
    'instagram_post_log','music_history_facebook_queue','news_cache',
    'studio_facebook_queue','worker_stats','youtube_facebook_queue','threads_post_log'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "Admins manage %I" ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))',
      t, t
    );
  END LOOP;
END $$;

-- ============ 15) SECURITY DEFINER functions: set search_path where missing ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
      ))
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;
