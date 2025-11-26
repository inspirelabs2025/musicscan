-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
CREATE POLICY "Public read access for news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

-- Create storage policy for authenticated upload
CREATE POLICY "Authenticated users can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-images' AND auth.role() = 'authenticated');

-- Create storage policy for service role to manage images
CREATE POLICY "Service role can manage news images"
ON storage.objects FOR ALL
USING (bucket_id = 'news-images' AND auth.role() = 'service_role');