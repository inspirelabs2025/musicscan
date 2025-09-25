-- Add collection_views column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS collection_views integer NOT NULL DEFAULT 0;

-- Add an index for better performance on collection_views queries
CREATE INDEX IF NOT EXISTS idx_profiles_collection_views ON public.profiles(collection_views);

-- Update existing profiles to have 0 collection_views if they're NULL
UPDATE public.profiles SET collection_views = 0 WHERE collection_views IS NULL;