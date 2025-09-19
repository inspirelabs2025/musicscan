-- First, let's find blog posts that can be linked to albums with discogs_id
-- Update blog posts by matching artist, title, and year from yaml_frontmatter to scan tables

-- For CD scans
UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', cd_scan.discogs_id)
FROM cd_scan 
WHERE blog_posts.album_type = 'cd'
  AND cd_scan.discogs_id IS NOT NULL
  AND LOWER(TRIM(yaml_frontmatter->>'artist')) = LOWER(TRIM(cd_scan.artist))
  AND LOWER(TRIM(yaml_frontmatter->>'album')) = LOWER(TRIM(cd_scan.title))
  AND (yaml_frontmatter->>'discogs_id' IS NULL OR yaml_frontmatter->>'discogs_id' = '—');

-- For Vinyl scans  
UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', vinyl2_scan.discogs_id)
FROM vinyl2_scan 
WHERE blog_posts.album_type = 'vinyl'
  AND vinyl2_scan.discogs_id IS NOT NULL
  AND LOWER(TRIM(yaml_frontmatter->>'artist')) = LOWER(TRIM(vinyl2_scan.artist))
  AND LOWER(TRIM(yaml_frontmatter->>'album')) = LOWER(TRIM(vinyl2_scan.title))
  AND (yaml_frontmatter->>'discogs_id' IS NULL OR yaml_frontmatter->>'discogs_id' = '—');