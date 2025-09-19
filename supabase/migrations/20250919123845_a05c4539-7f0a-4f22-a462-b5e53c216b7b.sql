-- Add album_cover_url column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN album_cover_url TEXT;