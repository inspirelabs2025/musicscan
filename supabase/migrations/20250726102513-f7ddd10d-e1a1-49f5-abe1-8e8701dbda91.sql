-- Performance optimization: Add critical database indexes

-- Releases table indexes (most important for new canonical system)
CREATE INDEX IF NOT EXISTS idx_releases_discogs_id_unique ON releases (discogs_id);
CREATE INDEX IF NOT EXISTS idx_releases_artist_title ON releases (artist, title);
CREATE INDEX IF NOT EXISTS idx_releases_total_scans ON releases (total_scans DESC) WHERE total_scans > 0;

-- CD scan indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_cd_scan_user_public ON cd_scan (user_id, is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_cd_scan_user_sale ON cd_scan (user_id, is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_cd_scan_release_user ON cd_scan (release_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cd_scan_discogs_created ON cd_scan (discogs_id, created_at DESC) WHERE discogs_id IS NOT NULL;

-- Vinyl scan indexes for frequent queries  
CREATE INDEX IF NOT EXISTS idx_vinyl2_scan_user_public ON vinyl2_scan (user_id, is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_vinyl2_scan_user_sale ON vinyl2_scan (user_id, is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_vinyl2_scan_release_user ON vinyl2_scan (release_id, user_id);
CREATE INDEX IF NOT EXISTS idx_vinyl2_scan_discogs_created ON vinyl2_scan (discogs_id, created_at DESC) WHERE discogs_id IS NOT NULL;

-- AI scan results indexes
CREATE INDEX IF NOT EXISTS idx_ai_scan_results_user_status ON ai_scan_results (user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_scan_results_created_desc ON ai_scan_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scan_results_discogs_id ON ai_scan_results (discogs_id) WHERE discogs_id IS NOT NULL;

-- Chat messages indexes for collection chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_session ON chat_messages (user_id, session_id, created_at DESC);

-- Batch uploads indexes  
CREATE INDEX IF NOT EXISTS idx_batch_uploads_user_status ON batch_uploads (user_id, status);
CREATE INDEX IF NOT EXISTS idx_batch_uploads_created_desc ON batch_uploads (created_at DESC);

-- User shops indexes for public access
CREATE INDEX IF NOT EXISTS idx_user_shops_slug ON user_shops (shop_url_slug) WHERE shop_url_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_shops_public ON user_shops (is_public, updated_at DESC) WHERE is_public = true;