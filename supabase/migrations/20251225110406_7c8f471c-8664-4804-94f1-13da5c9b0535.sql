
-- Add story_id column to master_singles for linking to music_stories
ALTER TABLE master_singles ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES music_stories(id);

-- Link existing blog_posts to master_albums based on artist + album title match
UPDATE master_albums ma
SET 
  blog_id = bp.id,
  has_blog = true
FROM blog_posts bp
WHERE 
  LOWER(TRIM(ma.artist_name)) = LOWER(TRIM(bp.yaml_frontmatter->>'artist'))
  AND LOWER(TRIM(ma.title)) = LOWER(TRIM(bp.yaml_frontmatter->>'album'))
  AND bp.is_published = true
  AND ma.blog_id IS NULL;

-- Link existing music_stories (singles) to master_singles based on artist + single title match
UPDATE master_singles ms
SET 
  story_id = mst.id,
  has_story = true
FROM music_stories mst
WHERE 
  LOWER(TRIM(ms.artist_name)) = LOWER(TRIM(mst.artist))
  AND LOWER(TRIM(ms.title)) = LOWER(TRIM(mst.single_name))
  AND mst.is_published = true
  AND mst.single_name IS NOT NULL
  AND ms.story_id IS NULL;

-- Create index for faster lookups during deduplication
CREATE INDEX IF NOT EXISTS idx_master_albums_artist_title ON master_albums (LOWER(artist_name), LOWER(title));
CREATE INDEX IF NOT EXISTS idx_master_singles_artist_title ON master_singles (LOWER(artist_name), LOWER(title));
CREATE INDEX IF NOT EXISTS idx_blog_posts_artist_album ON blog_posts ((LOWER(yaml_frontmatter->>'artist')), (LOWER(yaml_frontmatter->>'album')));
CREATE INDEX IF NOT EXISTS idx_music_stories_artist_single ON music_stories (LOWER(artist), LOWER(single_name)) WHERE single_name IS NOT NULL;
