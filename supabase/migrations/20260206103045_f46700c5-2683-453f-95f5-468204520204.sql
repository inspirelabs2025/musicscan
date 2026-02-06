
-- =============================================
-- CD Scan Pipeline V2 - Collector-Grade Schema
-- =============================================

-- Enum types
DO $$ BEGIN
  CREATE TYPE scan_session_status AS ENUM ('draft','processing','done','needs_more_photos','failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_image_kind AS ENUM ('disc_hub','back_cover','front','spine','other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE discogs_match_status AS ENUM ('single_match','multiple_candidates','no_match','needs_more_photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- A) scan_sessions
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status scan_session_status NOT NULL DEFAULT 'draft',
  media_type TEXT NOT NULL DEFAULT 'cd',
  notes TEXT
);

ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan sessions"
  ON public.scan_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own scan sessions"
  ON public.scan_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scan sessions"
  ON public.scan_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scan sessions"
  ON public.scan_sessions FOR DELETE USING (auth.uid() = user_id);

-- B) scan_images
CREATE TABLE IF NOT EXISTS public.scan_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_session_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  kind scan_image_kind NOT NULL DEFAULT 'other',
  storage_path TEXT NOT NULL,
  quality_score INT CHECK (quality_score >= 0 AND quality_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan images"
  ON public.scan_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can create own scan images"
  ON public.scan_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can delete own scan images"
  ON public.scan_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));

-- C) scan_extractions
CREATE TABLE IF NOT EXISTS public.scan_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_session_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  raw_value TEXT,
  normalized_value TEXT,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  source_image_id UUID REFERENCES public.scan_images(id) ON DELETE SET NULL,
  extractor_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan extractions"
  ON public.scan_extractions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can create own scan extractions"
  ON public.scan_extractions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));

-- D) scan_results
CREATE TABLE IF NOT EXISTS public.scan_results (
  scan_session_id UUID PRIMARY KEY REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  artist TEXT,
  title TEXT,
  label TEXT,
  catno TEXT,
  barcode TEXT,
  country TEXT,
  year INT,
  matrix TEXT,
  ifpi_master TEXT,
  ifpi_mould TEXT,
  discogs_match_status discogs_match_status NOT NULL DEFAULT 'no_match',
  discogs_release_id INT,
  discogs_candidates JSONB DEFAULT '[]'::jsonb,
  overall_confidence FLOAT DEFAULT 0,
  audit JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan results"
  ON public.scan_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can create own scan results"
  ON public.scan_results FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can update own scan results"
  ON public.scan_results FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.scan_sessions s WHERE s.id = scan_session_id AND s.user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user ON public.scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_status ON public.scan_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scan_images_session ON public.scan_images(scan_session_id);
CREATE INDEX IF NOT EXISTS idx_scan_extractions_session ON public.scan_extractions(scan_session_id);
CREATE INDEX IF NOT EXISTS idx_scan_extractions_field ON public.scan_extractions(field_name);
CREATE INDEX IF NOT EXISTS idx_scan_results_discogs ON public.scan_results(discogs_release_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_scan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_scan_updated_at();

CREATE TRIGGER update_scan_results_updated_at
  BEFORE UPDATE ON public.scan_results
  FOR EACH ROW EXECUTE FUNCTION public.update_scan_updated_at();
