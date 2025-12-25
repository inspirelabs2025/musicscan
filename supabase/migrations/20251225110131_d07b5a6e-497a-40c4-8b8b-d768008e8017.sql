-- SYNC SCRIPT: Link existing content to curated_artists (FIXED)

-- Step 1: Update has_artist_story and artist_story_id based on artist_stories table
UPDATE curated_artists ca
SET 
  has_artist_story = true,
  artist_story_id = ast.id,
  updated_at = now()
FROM artist_stories ast
WHERE LOWER(ca.artist_name) = LOWER(ast.artist_name)
  AND ast.is_published = true;

-- Step 2: Count albums processed (blog_posts with matching artist)
UPDATE curated_artists ca
SET 
  albums_processed = subq.album_count,
  updated_at = now()
FROM (
  SELECT 
    COALESCE(bp.yaml_frontmatter->>'artist', '') as bp_artist,
    COUNT(*) as album_count
  FROM blog_posts bp
  WHERE bp.is_published = true
  GROUP BY COALESCE(bp.yaml_frontmatter->>'artist', '')
) subq
WHERE LOWER(ca.artist_name) = LOWER(subq.bp_artist);

-- Step 3: Count singles processed (music_stories with single_name - uses 'artist' column)
UPDATE curated_artists ca
SET 
  singles_processed = subq.singles_count,
  updated_at = now()
FROM (
  SELECT 
    ms.artist as ms_artist,
    COUNT(*) as singles_count
  FROM music_stories ms
  WHERE ms.single_name IS NOT NULL AND ms.is_published = true
  GROUP BY ms.artist
) subq
WHERE LOWER(ca.artist_name) = LOWER(subq.ms_artist);

-- Step 4: Count products created (platform_products - uses 'artist' column)
UPDATE curated_artists ca
SET 
  products_created = subq.product_count,
  updated_at = now()
FROM (
  SELECT 
    pp.artist as pp_artist,
    COUNT(*) as product_count
  FROM platform_products pp
  WHERE pp.status = 'active'
  GROUP BY pp.artist
) subq
WHERE LOWER(ca.artist_name) = LOWER(subq.pp_artist);

-- Step 5: Sync albums_count from master_albums
UPDATE curated_artists ca
SET 
  albums_count = COALESCE(subq.album_count, 0),
  updated_at = now()
FROM (
  SELECT 
    artist_id,
    COUNT(*) as album_count
  FROM master_albums
  GROUP BY artist_id
) subq
WHERE ca.id = subq.artist_id;

-- Step 6: Sync singles_count from master_singles
UPDATE curated_artists ca
SET 
  singles_count = COALESCE(subq.singles_count, 0),
  updated_at = now()
FROM (
  SELECT 
    artist_id,
    COUNT(*) as singles_count
  FROM master_singles
  GROUP BY artist_id
) subq
WHERE ca.id = subq.artist_id;