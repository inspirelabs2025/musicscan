-- ============================================================
-- 1. cd_scan: remove permissive CASE policies (strict authenticated duplicates already exist)
-- ============================================================
DROP POLICY IF EXISTS "Users can view cd scans" ON public.cd_scan;
DROP POLICY IF EXISTS "Users can create cd scans" ON public.cd_scan;
DROP POLICY IF EXISTS "Users can update cd scans" ON public.cd_scan;
DROP POLICY IF EXISTS "Users can delete cd scans" ON public.cd_scan;

-- ============================================================
-- 2. vinyl2_scan: remove permissive CASE policies
-- ============================================================
DROP POLICY IF EXISTS "Users can view vinyl scans" ON public.vinyl2_scan;
DROP POLICY IF EXISTS "Users can create vinyl scans" ON public.vinyl2_scan;
DROP POLICY IF EXISTS "Users can update vinyl scans" ON public.vinyl2_scan;
DROP POLICY IF EXISTS "Users can delete vinyl scans" ON public.vinyl2_scan;

-- ============================================================
-- 3. ai_scan_results: replace CASE policies with strict owner-only
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own scans" ON public.ai_scan_results;
DROP POLICY IF EXISTS "Users can create their own scans" ON public.ai_scan_results;
DROP POLICY IF EXISTS "Users can update their own scans" ON public.ai_scan_results;
DROP POLICY IF EXISTS "Users can delete their own scans" ON public.ai_scan_results;

CREATE POLICY "Users can view their own scans"
  ON public.ai_scan_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans"
  ON public.ai_scan_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
  ON public.ai_scan_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON public.ai_scan_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. shop_products: fix broken admin check
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all shop products" ON public.shop_products;

CREATE POLICY "Admins can manage all shop products"
  ON public.shop_products FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 5. shop_orders: remove guest enumeration via SELECT
-- ============================================================
DROP POLICY IF EXISTS "Guest users can view their orders via email and order ID" ON public.shop_orders;
DROP POLICY IF EXISTS "Users can view orders they are involved in" ON public.shop_orders;

CREATE POLICY "Users can view orders they are involved in"
  ON public.shop_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Guest order lookups must be performed via a server-side edge function
-- using the service role + a secure per-order token. No public SELECT.

-- ============================================================
-- 6. vinyl_records_backup: lock down (no user_id column → authenticated-only read, no public write)
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own vinyl backup records" ON public.vinyl_records_backup;
DROP POLICY IF EXISTS "Allow insert for backup operations" ON public.vinyl_records_backup;

CREATE POLICY "Authenticated users can view vinyl backup records"
  ON public.vinyl_records_backup FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE are intentionally only available via service_role
-- (which bypasses RLS) for backend backup operations.

-- ============================================================
-- 7. shop_transactions: remove permissive system policy
-- ============================================================
DROP POLICY IF EXISTS "System can manage transactions" ON public.shop_transactions;
-- service_role bypasses RLS automatically

-- ============================================================
-- 8. usage_tracking: remove permissive system policy
-- ============================================================
DROP POLICY IF EXISTS "System can manage usage tracking" ON public.usage_tracking;

-- ============================================================
-- 9. user_subscriptions: remove permissive system policy
-- ============================================================
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.user_subscriptions;

-- ============================================================
-- 10. subscription_events: remove permissive system policy
-- ============================================================
DROP POLICY IF EXISTS "System can manage subscription events" ON public.subscription_events;

-- ============================================================
-- 11. time_machine_fan_memories: only approved memories visible publicly
-- ============================================================
DROP POLICY IF EXISTS "Approved fan memories are viewable by everyone" ON public.time_machine_fan_memories;

CREATE POLICY "Approved fan memories are viewable by everyone"
  ON public.time_machine_fan_memories FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Admins can view all fan memories"
  ON public.time_machine_fan_memories FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 12. admin_album_reviews: only published reviews visible publicly
-- ============================================================
DROP POLICY IF EXISTS "Published reviews viewable by everyone" ON public.admin_album_reviews;

CREATE POLICY "Published reviews viewable by everyone"
  ON public.admin_album_reviews FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all album reviews"
  ON public.admin_album_reviews FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 13. time_machine_events: only published events visible publicly
-- ============================================================
DROP POLICY IF EXISTS "Time Machine events are viewable by everyone" ON public.time_machine_events;

CREATE POLICY "Time Machine events are viewable by everyone"
  ON public.time_machine_events FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all time machine events"
  ON public.time_machine_events FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 14. Realtime: stop broadcasting cd_scan changes to all subscribers
-- ============================================================
ALTER PUBLICATION supabase_realtime DROP TABLE public.cd_scan;