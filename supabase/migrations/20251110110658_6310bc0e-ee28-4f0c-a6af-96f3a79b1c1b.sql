-- Create photo_likes table to track which users liked which photos
CREATE TABLE IF NOT EXISTS photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo_id ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user_id ON photo_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_created_at ON photo_likes(created_at DESC);

-- Enable RLS
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_likes
CREATE POLICY "Anyone can view likes"
  ON photo_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can like photos"
  ON photo_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON photo_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update like_count on photos table
CREATE OR REPLACE FUNCTION update_photo_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE photos 
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photos 
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update like_count
DROP TRIGGER IF EXISTS update_photo_like_count_trigger ON photo_likes;
CREATE TRIGGER update_photo_like_count_trigger
  AFTER INSERT OR DELETE ON photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_like_count();

-- Enable realtime for photo_likes table
ALTER TABLE photo_likes REPLICA IDENTITY FULL;

-- Add photo_likes to realtime publication
DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add table to publication if not already added
    ALTER PUBLICATION supabase_realtime ADD TABLE photo_likes;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore
END $$;