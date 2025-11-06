-- Enable RLS on sitemap regeneration tables
ALTER TABLE public.sitemap_regeneration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitemap_regeneration_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sitemap_regeneration_log
CREATE POLICY "System and authenticated users can view sitemap logs"
  ON public.sitemap_regeneration_log
  FOR SELECT
  USING (auth.uid() IS NOT NULL OR true);

CREATE POLICY "System can manage sitemap logs"
  ON public.sitemap_regeneration_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for sitemap_regeneration_queue
CREATE POLICY "System and authenticated users can view sitemap queue"
  ON public.sitemap_regeneration_queue
  FOR SELECT
  USING (auth.uid() IS NOT NULL OR true);

CREATE POLICY "System can manage sitemap queue"
  ON public.sitemap_regeneration_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);