-- Publiceer de nieuwe Jimi Hendrix blog post en corrigeer de slug
UPDATE blog_posts 
SET 
  is_published = true, 
  slug = 'jimi-hendrix-jimi-hendrix-gangster-of-love-1984',
  published_at = now()
WHERE id = 'abc8bfd5-a1b9-4df3-aa0d-56e99f8f1e07';