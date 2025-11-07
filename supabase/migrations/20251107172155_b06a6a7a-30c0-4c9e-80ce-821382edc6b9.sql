-- Create storage bucket for Time Machine posters
INSERT INTO storage.buckets (id, name, public)
VALUES ('time-machine-posters', 'time-machine-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for time-machine-posters bucket
CREATE POLICY "Time Machine posters are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'time-machine-posters');

CREATE POLICY "Authenticated users can upload Time Machine posters"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'time-machine-posters' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update Time Machine posters"
ON storage.objects FOR UPDATE
USING (bucket_id = 'time-machine-posters' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete Time Machine posters"
ON storage.objects FOR DELETE
USING (bucket_id = 'time-machine-posters' AND auth.uid() IS NOT NULL);