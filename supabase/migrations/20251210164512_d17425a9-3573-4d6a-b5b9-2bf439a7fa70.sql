-- Create render_outputs storage bucket for worker GIF uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'render_outputs',
  'render_outputs',
  true,
  52428800, -- 50MB limit
  ARRAY['image/gif', 'image/png', 'image/jpeg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for render_outputs"
ON storage.objects FOR SELECT
USING (bucket_id = 'render_outputs');

-- Allow service role to upload
CREATE POLICY "Service role can upload to render_outputs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'render_outputs');

-- Allow service role to update
CREATE POLICY "Service role can update render_outputs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'render_outputs');

-- Allow service role to delete
CREATE POLICY "Service role can delete from render_outputs"
ON storage.objects FOR DELETE
USING (bucket_id = 'render_outputs');