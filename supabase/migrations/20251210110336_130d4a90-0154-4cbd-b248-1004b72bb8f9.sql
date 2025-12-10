
-- Create renders storage bucket for GIF output
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('renders', 'renders', true, 52428800, ARRAY['image/gif', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for renders" ON storage.objects
FOR SELECT USING (bucket_id = 'renders');

-- Allow service role to upload
CREATE POLICY "Service role upload for renders" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'renders');

-- Allow service role to update
CREATE POLICY "Service role update for renders" ON storage.objects
FOR UPDATE USING (bucket_id = 'renders');
