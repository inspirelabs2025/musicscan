-- Publish Hendrix blog post by slug or album_id as a safeguard
UPDATE public.blog_posts
SET 
  is_published = true,
  published_at = COALESCE(published_at, now()),
  updated_at = now()
WHERE slug = 'jimi-hendrix-jimi-hendrix-gangster-of-love-1984'
   OR album_id = '48903ef6-4bb1-4912-a332-f07c75de74dc';