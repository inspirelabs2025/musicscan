-- Create storage bucket for TikTok videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tiktok-videos', 
  'tiktok-videos', 
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload tiktok videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tiktok-videos');

-- Create policy for public read access
CREATE POLICY "Public can view tiktok videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tiktok-videos');

-- Create policy for authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete tiktok videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tiktok-videos');