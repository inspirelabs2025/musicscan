-- Add og_image_url column to photos table for custom Open Graph images
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS og_image_url TEXT;