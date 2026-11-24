-- ===== Tables without row protection =====
ALTER TABLE public.content_growth_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_distribution_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage content growth log" ON public.content_growth_log FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage fb distribution log" ON public.fb_distribution_log FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===== Admin/system tables: admin-only (service role bypasses RLS) =====
DROP POLICY IF EXISTS "Authenticated users can create batch processing status" ON public.batch_processing_status;
DROP POLICY IF EXISTS "Authenticated users can update batch processing status" ON public.batch_processing_status;
DROP POLICY IF EXISTS "Authenticated users can view batch processing status" ON public.batch_processing_status;
CREATE POLICY "Admins manage batch processing status" ON public.batch_processing_status FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete spotlight images" ON public.spotlight_images;
DROP POLICY IF EXISTS "Authenticated users can insert spotlight images" ON public.spotlight_images;
DROP POLICY IF EXISTS "Authenticated users can update spotlight images" ON public.spotlight_images;
CREATE POLICY "Admins manage spotlight images" ON public.spotlight_images FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert discoveries" ON public.youtube_discoveries;
CREATE POLICY "Admins insert discoveries" ON public.youtube_discoveries FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow update track insights" ON public.spotify_track_insights;
DROP POLICY IF EXISTS "Authenticated users can insert track insights" ON public.spotify_track_insights;
DROP POLICY IF EXISTS "Anyone can read track insights" ON public.spotify_track_insights;
CREATE POLICY "Admins write track insights" ON public.spotify_track_insights FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update track insights" ON public.spotify_track_insights FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create logs" ON public.news_generation_logs;
DROP POLICY IF EXISTS "News generation logs are viewable by everyone" ON public.news_generation_logs;
CREATE POLICY "Admins manage news generation logs" ON public.news_generation_logs FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert anecdotes" ON public.music_anecdotes;
DROP POLICY IF EXISTS "System can update anecdotes" ON public.music_anecdotes;
CREATE POLICY "Admins insert anecdotes" ON public.music_anecdotes FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update anecdotes" ON public.music_anecdotes FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can manage cronjob logs" ON public.cronjob_execution_log;
CREATE POLICY "Admins manage cronjob logs" ON public.cronjob_execution_log FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System and authenticated users can view sitemap logs" ON public.sitemap_regeneration_log;
DROP POLICY IF EXISTS "System can manage sitemap logs" ON public.sitemap_regeneration_log;
CREATE POLICY "Admins manage sitemap logs" ON public.sitemap_regeneration_log FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "System and authenticated users can view sitemap queue" ON public.sitemap_regeneration_queue;
DROP POLICY IF EXISTS "System can manage sitemap queue" ON public.sitemap_regeneration_queue;
CREATE POLICY "Admins manage sitemap queue" ON public.sitemap_regeneration_queue FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can delete recently played" ON public.spotify_recently_played;
DROP POLICY IF EXISTS "Service role can insert recently played" ON public.spotify_recently_played;
DROP POLICY IF EXISTS "Service role full access" ON public.seo_quality_issues;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.platform_orders;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.echo_conversations;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.echo_messages;
DROP POLICY IF EXISTS "System can insert clean analytics" ON public.clean_analytics;

DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.discogs_price_listings;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.discogs_price_listings;
CREATE POLICY "Admins read price listings" ON public.discogs_price_listings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view import log" ON public.discogs_import_log;
CREATE POLICY "Admins view import log" ON public.discogs_import_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view price changes" ON public.price_change_log;
CREATE POLICY "Admins view price changes" ON public.price_change_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view indexnow submissions" ON public.indexnow_submissions;
CREATE POLICY "Admins view indexnow submissions" ON public.indexnow_submissions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view challenges by token" ON public.quiz_challenges;
CREATE POLICY "Participants view their challenges" ON public.quiz_challenges FOR SELECT TO authenticated USING (auth.uid() = challenger_id OR auth.uid() = challenged_user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view photo view records" ON public.photo_views;
CREATE POLICY "Admins view photo view records" ON public.photo_views FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can track photo views" ON public.photo_views;
CREATE POLICY "Visitors track own photo views" ON public.photo_views FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ===== Public write forms: bind to caller / validate =====
DROP POLICY IF EXISTS "Anyone can submit scores" ON public.christmas_memory_scores;
CREATE POLICY "Visitors submit own scores" ON public.christmas_memory_scores FOR INSERT TO anon, authenticated WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND score >= 0 AND moves >= 0 AND time_seconds >= 0);
DROP POLICY IF EXISTS "Anyone can vote" ON public.christmas_poll_votes;
CREATE POLICY "Visitors cast own votes" ON public.christmas_poll_votes FOR INSERT TO anon, authenticated WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND poll_id IS NOT NULL);
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Visitors can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 255 AND coalesce(is_confirmed,false) = false AND unsubscribed_at IS NULL);
DROP POLICY IF EXISTS "Anyone can insert pageviews" ON public.pageviews;
CREATE POLICY "Visitors log own pageviews" ON public.pageviews FOR INSERT TO anon, authenticated WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND length(path) <= 2048);

DROP POLICY IF EXISTS "Public can view all likes" ON public.photo_likes;

-- ===== Storage: admin-only content buckets =====
DROP POLICY IF EXISTS "Admins can delete shop product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update shop product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload shop product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete TikTok videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update TikTok videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload TikTok videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete tiktok videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload tiktok videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete Time Machine posters" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update Time Machine posters" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload Time Machine posters" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their spotlight uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload spotlight images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update artist images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload artist images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "System can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage news images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to render-output" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage render-output" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete from render_outputs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update render_outputs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload to render_outputs" ON storage.objects;
DROP POLICY IF EXISTS "Service role update for renders" ON storage.objects;
DROP POLICY IF EXISTS "Service role upload for renders" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload artist spotlight images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete socks" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update socks" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload socks" ON storage.objects;

CREATE POLICY "Admins manage content bucket files" ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('shop-products','tiktok-videos','time-machine-posters','time-machine-original-posters','product-images','spotlight-uploads','artist-images','news-images','render-output','render_outputs','renders','artist-spotlights','socks') AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id IN ('shop-products','tiktok-videos','time-machine-posters','time-machine-original-posters','product-images','spotlight-uploads','artist-images','news-images','render-output','render_outputs','renders','artist-spotlights','socks') AND public.is_admin(auth.uid()));

-- ===== Storage: fan wall photos bound to own folder =====
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Users upload photos to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fanwall-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ===== Storage: scan photos (guests may upload new files; only owner/admin may change) =====
DROP POLICY IF EXISTS "Allow all access to vinyl_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to vinyl_images" ON storage.objects;
CREATE POLICY "Visitors upload scan photos" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'vinyl_images' AND (owner_id IS NULL OR owner_id = auth.uid()::text));
CREATE POLICY "Owners or admins read scan photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vinyl_images' AND (owner_id = auth.uid()::text OR public.is_admin(auth.uid())));
CREATE POLICY "Owners or admins change scan photos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vinyl_images' AND (owner_id = auth.uid()::text OR public.is_admin(auth.uid())))
WITH CHECK (bucket_id = 'vinyl_images' AND (owner_id = auth.uid()::text OR public.is_admin(auth.uid())));
CREATE POLICY "Owners or admins delete scan photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vinyl_images' AND (owner_id = auth.uid()::text OR public.is_admin(auth.uid())));