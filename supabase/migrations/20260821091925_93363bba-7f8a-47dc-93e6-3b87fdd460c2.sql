CREATE TABLE public.meta_description_fix_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  slug TEXT,
  reason TEXT,
  previous_meta_description TEXT,
  new_meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.meta_description_fix_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.meta_description_fix_log_id_seq TO service_role;
ALTER TABLE public.meta_description_fix_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view meta description fix log"
ON public.meta_description_fix_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.meta_description_fix_log TO authenticated;
CREATE INDEX idx_meta_description_fix_log_record ON public.meta_description_fix_log(record_id);