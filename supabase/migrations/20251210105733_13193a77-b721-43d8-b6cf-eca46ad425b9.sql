
-- Insert 5 new test render jobs from blog_posts that don't have jobs yet
INSERT INTO render_jobs (type, status, image_url, source_type, source_id, artist, title, priority, payload)
SELECT 
  'gif',
  'pending',
  album_cover_url,
  'blog_post',
  id,
  COALESCE((yaml_frontmatter->>'artist')::text, 'Unknown Artist'),
  COALESCE((yaml_frontmatter->>'title')::text, 'Unknown Album'),
  50,
  jsonb_build_object(
    'blog_id', id,
    'artist', COALESCE((yaml_frontmatter->>'artist')::text, 'Unknown Artist'),
    'title', COALESCE((yaml_frontmatter->>'title')::text, 'Unknown Album'),
    'slug', slug,
    'album_cover_url', album_cover_url
  )
FROM blog_posts 
WHERE album_cover_url IS NOT NULL 
  AND id NOT IN (SELECT source_id FROM render_jobs WHERE source_id IS NOT NULL)
ORDER BY created_at DESC
LIMIT 5;
