-- Sync albums_count from actual master_albums data
UPDATE curated_artists ca
SET 
  albums_count = (SELECT COUNT(*) FROM master_albums ma WHERE ma.artist_id = ca.id),
  singles_count = (SELECT COUNT(*) FROM master_singles ms WHERE ms.artist_id = ca.id),
  updated_at = now()
WHERE is_active = true;