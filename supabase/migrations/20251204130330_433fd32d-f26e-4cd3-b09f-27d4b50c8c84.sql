-- Create storage bucket for podcast artwork (images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'podcast-artwork',
  'podcast-artwork',
  true,
  5242880, -- 5MB limit for images
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS policies for podcast-artwork bucket
CREATE POLICY "Public read access for podcast artwork"
ON storage.objects FOR SELECT
USING (bucket_id = 'podcast-artwork');

CREATE POLICY "Admins can upload podcast artwork"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'podcast-artwork'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update podcast artwork"
ON storage.objects FOR UPDATE
USING (bucket_id = 'podcast-artwork' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete podcast artwork"
ON storage.objects FOR DELETE
USING (bucket_id = 'podcast-artwork' AND public.is_admin(auth.uid()));