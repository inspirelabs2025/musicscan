-- Add unique constraint on artist_name + title for AI-based album discovery
ALTER TABLE master_albums DROP CONSTRAINT IF EXISTS master_albums_discogs_master_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS master_albums_artist_title_idx 
ON master_albums (artist_name, title);
