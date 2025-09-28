-- Fix the blog_posts album_type constraint to allow 'release'
-- First drop the existing constraint
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_album_type_check;

-- Add new constraint that includes 'release' as valid album_type
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_album_type_check 
CHECK (album_type IN ('cd', 'vinyl', 'ai', 'release'));