
-- Helper: drop the open "System can manage ..." ALL policies (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "System can manage news blog posts" ON public.news_blog_posts;
DROP POLICY IF EXISTS "System can manage master albums" ON public.master_albums;
DROP POLICY IF EXISTS "System can manage daily challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "System can manage RSS feed episodes" ON public.rss_feed_episodes;
DROP POLICY IF EXISTS "System can manage import log" ON public.discogs_import_log;
DROP POLICY IF EXISTS "System can manage batch queue items" ON public.batch_queue_items;

-- news_blog_posts: keep public SELECT, restrict writes to admins
CREATE POLICY "Admins can insert news blog posts"
  ON public.news_blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update news blog posts"
  ON public.news_blog_posts FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete news blog posts"
  ON public.news_blog_posts FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- master_albums: keep public SELECT, admin writes
CREATE POLICY "Admins can insert master albums"
  ON public.master_albums FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update master albums"
  ON public.master_albums FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete master albums"
  ON public.master_albums FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- daily_challenges: keep public SELECT, admin writes
CREATE POLICY "Admins can insert daily challenges"
  ON public.daily_challenges FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update daily challenges"
  ON public.daily_challenges FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete daily challenges"
  ON public.daily_challenges FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- rss_feed_episodes: keep public SELECT, admin writes
CREATE POLICY "Admins can insert rss feed episodes"
  ON public.rss_feed_episodes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update rss feed episodes"
  ON public.rss_feed_episodes FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete rss feed episodes"
  ON public.rss_feed_episodes FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- discogs_import_log: keep public SELECT, admin writes
CREATE POLICY "Admins can insert discogs import log"
  ON public.discogs_import_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update discogs import log"
  ON public.discogs_import_log FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete discogs import log"
  ON public.discogs_import_log FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- batch_queue_items: admin-only (pipeline state, not public)
CREATE POLICY "Admins can view batch queue items"
  ON public.batch_queue_items FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert batch queue items"
  ON public.batch_queue_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update batch queue items"
  ON public.batch_queue_items FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete batch queue items"
  ON public.batch_queue_items FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- promo_codes: drop public read; redemption flows via SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "Anyone can read active promo codes for validation" ON public.promo_codes;
-- Admins can still list codes for management UI
CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
