-- Manually assign discogs_id values to known blog posts based on research
-- These are examples - in a real system you'd get these from actual Discogs data

-- Update specific blog posts with their discogs_id values
UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', 4194438)
WHERE slug = 'tadd-dameron-with-john-coltrane-tadd-dameron-with-john-coltrane-mating-call-2007';

UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', 588618)
WHERE slug = 'jimi-hendrix-jimi-hendrix-gangster-of-love-1984';

-- These IDs are examples - you would replace with actual Discogs IDs for these albums
UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', 1234567)
WHERE slug = 'van-morrison-van-morrison-the-best-of-van-morrison-1990';

UPDATE blog_posts 
SET yaml_frontmatter = yaml_frontmatter || jsonb_build_object('discogs_id', 2345678)
WHERE slug = 'herman-grimme-herman-grimme-salad-days-2001';