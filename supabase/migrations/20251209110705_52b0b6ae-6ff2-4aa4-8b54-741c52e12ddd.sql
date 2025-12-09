-- Queue blog posts that have album covers but are missing from tiktok_video_queue and tiktok_video_url
INSERT INTO tiktok_video_queue (blog_id, album_cover_url, artist, title, priority, status)
SELECT 
  bp.id,
  bp.album_cover_url,
  COALESCE(bp.yaml_frontmatter->>'artist', 'Unknown'),
  COALESCE(bp.yaml_frontmatter->>'album', bp.yaml_frontmatter->>'title', 'Unknown'),
  100,
  'pending'
FROM blog_posts bp
WHERE bp.is_published = true
  AND bp.album_cover_url IS NOT NULL
  AND bp.tiktok_video_url IS NULL
  AND NOT EXISTS (SELECT 1 FROM tiktok_video_queue tvq WHERE tvq.blog_id = bp.id);