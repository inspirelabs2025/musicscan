-- Add view_count column to photos table if not exists
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create photo_views table for tracking individual views
CREATE TABLE IF NOT EXISTS photo_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_photo_views_photo_id ON photo_views(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_views_viewed_at ON photo_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE photo_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert views
CREATE POLICY "Anyone can track photo views"
ON photo_views FOR INSERT
WITH CHECK (true);

-- Policy: Users can view all view records
CREATE POLICY "Anyone can view photo view records"
ON photo_views FOR SELECT
USING (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_photo_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE photos
  SET view_count = view_count + 1
  WHERE id = NEW.photo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically increment view count
DROP TRIGGER IF EXISTS trigger_increment_photo_view_count ON photo_views;
CREATE TRIGGER trigger_increment_photo_view_count
AFTER INSERT ON photo_views
FOR EACH ROW
EXECUTE FUNCTION increment_photo_view_count();

-- Create materialized view for featured photos (most viewed in last 30 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS featured_photos AS
SELECT 
  p.*,
  COUNT(DISTINCT pv.id) as recent_views
FROM photos p
LEFT JOIN photo_views pv ON p.id = pv.photo_id 
  AND pv.viewed_at > NOW() - INTERVAL '30 days'
WHERE p.status = 'published'
GROUP BY p.id
ORDER BY recent_views DESC, p.like_count DESC, p.published_at DESC
LIMIT 12;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_photos_id ON featured_photos(id);

-- Function to refresh featured photos
CREATE OR REPLACE FUNCTION refresh_featured_photos()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY featured_photos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;