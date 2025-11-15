-- Create storage bucket for artist images
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-images', 'artist-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view artist images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public Access for Artist Images'
  ) THEN
    CREATE POLICY "Public Access for Artist Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'artist-images');
  END IF;
END $$;

-- Allow authenticated users to upload artist images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can upload artist images'
  ) THEN
    CREATE POLICY "Authenticated users can upload artist images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'artist-images');
  END IF;
END $$;

-- Allow authenticated users to update their uploaded artist images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can update artist images'
  ) THEN
    CREATE POLICY "Authenticated users can update artist images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'artist-images');
  END IF;
END $$;