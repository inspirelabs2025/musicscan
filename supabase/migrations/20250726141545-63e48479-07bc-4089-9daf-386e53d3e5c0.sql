-- Add RLS policies for releases table to allow public read access
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

-- Allow public read access to releases for music news functionality
CREATE POLICY "Releases are viewable by everyone" 
ON public.releases 
FOR SELECT 
USING (true);

-- Allow public read access to album_insights for music news functionality
CREATE POLICY "Album insights are viewable by everyone" 
ON public.album_insights 
FOR SELECT 
USING (true);

-- Create a special system user UUID for releases that don't have an actual user
-- We'll use a fixed UUID that represents the system
CREATE OR REPLACE FUNCTION public.get_system_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql IMMUTABLE;