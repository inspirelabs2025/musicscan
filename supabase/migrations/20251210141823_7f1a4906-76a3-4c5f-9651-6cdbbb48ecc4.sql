-- Create storage bucket for render output (GIFs, videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('render-output', 'render-output', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to render-output bucket
CREATE POLICY "Public read access for render-output"
ON storage.objects FOR SELECT
USING (bucket_id = 'render-output');

-- Allow authenticated users to upload to render-output
CREATE POLICY "Authenticated users can upload to render-output"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'render-output');

-- Allow service role to manage render-output files
CREATE POLICY "Service role can manage render-output"
ON storage.objects FOR ALL
USING (bucket_id = 'render-output');