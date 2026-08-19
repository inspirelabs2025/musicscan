CREATE TABLE public.merge_duplicate_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid NOT NULL,
  slug text,
  kept_slug text,
  previous_is_published boolean,
  merged_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_merge_duplicate_log_blog_id ON public.merge_duplicate_log(blog_id);
GRANT ALL ON public.merge_duplicate_log TO service_role;
ALTER TABLE public.merge_duplicate_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view merge log" ON public.merge_duplicate_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.merge_duplicate_log TO authenticated;