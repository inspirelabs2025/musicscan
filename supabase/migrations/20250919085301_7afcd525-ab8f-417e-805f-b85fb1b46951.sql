-- Publish the Jimi Hendrix blog post that was unpublished due to regeneration error
UPDATE blog_posts 
SET 
  is_published = true,
  published_at = now(),
  updated_at = now()
WHERE id = '48903ef6-4bb1-4912-a332-f07c75de74dc'
  AND is_published = false;