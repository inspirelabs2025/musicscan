-- Allow 'product' as album_type in blog_posts
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_album_type_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_album_type_check 
  CHECK (album_type = ANY (ARRAY['cd'::text, 'vinyl'::text, 'ai'::text, 'release'::text, 'product'::text]));