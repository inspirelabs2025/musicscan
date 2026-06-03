ALTER TABLE public.email_center_templates ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#f4f4f5';
ALTER TABLE public.email_center_campaigns ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#f4f4f5';