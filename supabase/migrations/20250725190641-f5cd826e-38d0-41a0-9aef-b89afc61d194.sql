-- Create performance improvement indexes for better query speed

-- Index for vinyl2_scan queries by user_id and discogs_id
CREATE INDEX IF NOT EXISTS idx_vinyl2_scan_user_discogs 
ON vinyl2_scan(user_id, discogs_id) WHERE discogs_id IS NOT NULL;

-- Index for cd_scan queries by user_id and discogs_id  
CREATE INDEX IF NOT EXISTS idx_cd_scan_user_discogs 
ON cd_scan(user_id, discogs_id) WHERE discogs_id IS NOT NULL;

-- Index for ai_scan_results by user_id and status
CREATE INDEX IF NOT EXISTS idx_ai_scan_results_user_status 
ON ai_scan_results(user_id, status);

-- Index for vinyl2_scan created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_vinyl2_scan_created_at 
ON vinyl2_scan(created_at DESC);

-- Index for cd_scan created_at for chronological queries  
CREATE INDEX IF NOT EXISTS idx_cd_scan_created_at 
ON cd_scan(created_at DESC);

-- Index for chat_messages session queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
ON chat_messages(session_id, created_at);

-- Index for discogs_pricing_sessions by discogs_id
CREATE INDEX IF NOT EXISTS idx_discogs_pricing_sessions_discogs_id 
ON discogs_pricing_sessions(discogs_id);

-- Index for marketplace_listings by user_id and status
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user_status 
ON marketplace_listings(user_id, status);

-- Composite index for batch_uploads filtering
CREATE INDEX IF NOT EXISTS idx_batch_uploads_user_status_type 
ON batch_uploads(user_id, status, media_type);

-- Index for vinyl records by user_id and discogs_id
CREATE INDEX IF NOT EXISTS idx_vinyl_records_user_discogs 
ON vinyl_records(user_id, discogs_id) WHERE discogs_id IS NOT NULL;

-- Index for vehicle_parts by user_id and category
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_user_category 
ON vehicle_parts(user_id, category_id);

-- Index for part_scans by user_id and status
CREATE INDEX IF NOT EXISTS idx_part_scans_user_status 
ON part_scans(user_id, status);