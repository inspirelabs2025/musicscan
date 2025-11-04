-- Fase 1: Database Setup voor Discogs LP Crawler met Release IDs

-- 1.1 Tabel voor gecureerde artiesten
CREATE TABLE IF NOT EXISTS curated_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  releases_found_count INTEGER DEFAULT 0,
  last_crawled_at TIMESTAMPTZ,
  added_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curated_artists_active ON curated_artists(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_curated_artists_name ON curated_artists(artist_name);
CREATE INDEX IF NOT EXISTS idx_curated_artists_priority ON curated_artists(priority DESC, last_crawled_at ASC NULLS FIRST);

-- 1.2 Tabel voor Discogs import tracking (met RELEASE IDs)
CREATE TABLE IF NOT EXISTS discogs_import_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discogs_release_id INTEGER NOT NULL UNIQUE, -- ✅ Expliciet: Release ID (geen Master!)
  master_id INTEGER, -- ✅ Optioneel: voor referentie
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  year INTEGER,
  format TEXT,
  label TEXT,
  country TEXT,
  catalog_number TEXT,
  import_batch TIMESTAMPTZ DEFAULT now(),
  product_id UUID REFERENCES platform_products(id),
  blog_id UUID REFERENCES blog_posts(id),
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, skipped
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped'))
);

CREATE INDEX IF NOT EXISTS idx_discogs_import_release_id ON discogs_import_log(discogs_release_id);
CREATE INDEX IF NOT EXISTS idx_discogs_import_status ON discogs_import_log(status);
CREATE INDEX IF NOT EXISTS idx_discogs_import_batch ON discogs_import_log(import_batch);
CREATE INDEX IF NOT EXISTS idx_discogs_import_pending ON discogs_import_log(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_discogs_import_artist ON discogs_import_log(artist);

-- 1.3 RLS Policies voor curated_artists
ALTER TABLE curated_artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view curated artists"
  ON curated_artists FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage curated artists"
  ON curated_artists FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 1.4 RLS Policies voor discogs_import_log
ALTER TABLE discogs_import_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view import log"
  ON discogs_import_log FOR SELECT 
  USING (true);

CREATE POLICY "System can manage import log"
  ON discogs_import_log FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 1.5 Seed 200 artiesten (example set - vervang met je volledige lijst)
INSERT INTO curated_artists (artist_name, priority) VALUES
('David Bowie', 1),
('The Beatles', 1),
('Pink Floyd', 1),
('Led Zeppelin', 1),
('The Rolling Stones', 1),
('Queen', 1),
('Bob Dylan', 1),
('Jimi Hendrix', 1),
('Nirvana', 1),
('Radiohead', 1),
('Miles Davis', 2),
('John Coltrane', 2),
('The Velvet Underground', 2),
('Joy Division', 2),
('The Smiths', 2),
('Kraftwerk', 2),
('Black Sabbath', 2),
('Deep Purple', 2),
('AC/DC', 2),
('Metallica', 2)
ON CONFLICT (artist_name) DO NOTHING;