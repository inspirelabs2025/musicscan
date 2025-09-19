-- Update existing blog posts with discogs_id from their corresponding album records
UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', cd_scan.discogs_id)
FROM cd_scan 
WHERE blog_posts.album_id = cd_scan.id 
  AND blog_posts.album_type = 'cd' 
  AND cd_scan.discogs_id IS NOT NULL
  AND (yaml_frontmatter->>'discogs_id' IS NULL OR yaml_frontmatter->>'discogs_id' = '—');

UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', vinyl2_scan.discogs_id)
FROM vinyl2_scan 
WHERE blog_posts.album_id = vinyl2_scan.id 
  AND blog_posts.album_type = 'vinyl' 
  AND vinyl2_scan.discogs_id IS NOT NULL
  AND (yaml_frontmatter->>'discogs_id' IS NULL OR yaml_frontmatter->>'discogs_id' = '—');