-- Create table for month overview cache
CREATE TABLE public.month_overview_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  month_name TEXT NOT NULL,
  data_points JSONB DEFAULT '{}'::jsonb,
  generated_narratives JSONB DEFAULT '{}'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  UNIQUE(year, month)
);

-- Enable RLS
ALTER TABLE public.month_overview_cache ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Month overview cache is viewable by everyone"
ON public.month_overview_cache
FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "Admins can manage month overview cache"
ON public.month_overview_cache
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create index for fast lookups
CREATE INDEX idx_month_overview_year_month ON public.month_overview_cache(year, month);