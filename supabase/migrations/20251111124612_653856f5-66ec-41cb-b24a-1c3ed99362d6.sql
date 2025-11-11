-- Add original poster support to time_machine_events table
ALTER TABLE public.time_machine_events 
ADD COLUMN IF NOT EXISTS original_poster_url TEXT,
ADD COLUMN IF NOT EXISTS poster_source TEXT DEFAULT 'ai' CHECK (poster_source IN ('ai', 'original')),
ADD COLUMN IF NOT EXISTS original_poster_metadata JSONB;

-- Create index for searching by poster source
CREATE INDEX IF NOT EXISTS idx_time_machine_poster_source 
ON public.time_machine_events(poster_source);

-- Create storage bucket for original posters
INSERT INTO storage.buckets (id, name, public)
VALUES ('time-machine-original-posters', 'time-machine-original-posters', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for original posters bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'time-machine-original-posters');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'time-machine-original-posters');

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'time-machine-original-posters');

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'time-machine-original-posters');