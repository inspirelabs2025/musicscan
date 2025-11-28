-- Create table to track processed Spotify new releases
CREATE TABLE public.spotify_new_releases_processed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_album_id TEXT NOT NULL UNIQUE,
  artist TEXT NOT NULL,
  album_name TEXT NOT NULL,
  release_date TEXT,
  spotify_url TEXT,
  image_url TEXT,
  discogs_id INTEGER,
  product_id UUID REFERENCES public.platform_products(id),
  blog_id UUID REFERENCES public.blog_posts(id),
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for quick lookups
CREATE INDEX idx_spotify_new_releases_status ON public.spotify_new_releases_processed(status);
CREATE INDEX idx_spotify_new_releases_spotify_id ON public.spotify_new_releases_processed(spotify_album_id);

-- Enable RLS
ALTER TABLE public.spotify_new_releases_processed ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for admin dashboard)
CREATE POLICY "Anyone can view spotify new releases" 
ON public.spotify_new_releases_processed 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_spotify_new_releases_updated_at
BEFORE UPDATE ON public.spotify_new_releases_processed
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.spotify_new_releases_processed IS 'Tracks Spotify new releases that have been processed into products and blog posts';