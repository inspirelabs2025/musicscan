-- Add extra editable fields to media_library table
ALTER TABLE public.media_library 
ADD COLUMN IF NOT EXISTS manual_title TEXT,
ADD COLUMN IF NOT EXISTS manual_genre TEXT,
ADD COLUMN IF NOT EXISTS manual_year INTEGER;