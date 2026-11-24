DROP POLICY IF EXISTS "Service role can insert AI usage logs" ON public.ai_usage_log;
CREATE POLICY "Service role can insert AI usage logs" ON public.ai_usage_log FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY IF EXISTS "Service role can insert scan activity" ON public.scan_activity_log;
CREATE POLICY "Service role can insert scan activity" ON public.scan_activity_log FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view scores" ON public.christmas_memory_scores;
CREATE POLICY "Own or admin can view scores" ON public.christmas_memory_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Public can view votes" ON public.christmas_poll_votes;
CREATE POLICY "Own or admin can view votes" ON public.christmas_poll_votes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));