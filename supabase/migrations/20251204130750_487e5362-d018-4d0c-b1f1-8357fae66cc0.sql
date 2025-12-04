-- Update podcast-audio bucket to include audio MIME types
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 104857600, -- 100MB
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac']
WHERE id = 'podcast-audio';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for podcast audio" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload podcast audio" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update podcast audio" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete podcast audio" ON storage.objects;

-- Create RLS policies for podcast-audio bucket
CREATE POLICY "Public read access for podcast audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'podcast-audio');

CREATE POLICY "Admins can upload podcast audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'podcast-audio'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update podcast audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'podcast-audio' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete podcast audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'podcast-audio' AND public.is_admin(auth.uid()));