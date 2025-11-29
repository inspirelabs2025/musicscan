-- Create storage bucket for artist spotlight images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artist-spotlights',
  'artist-spotlights',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Artist spotlight images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'artist-spotlights');

-- Create policy for service role upload (edge functions use service role)
CREATE POLICY "Service role can upload artist spotlight images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'artist-spotlights');