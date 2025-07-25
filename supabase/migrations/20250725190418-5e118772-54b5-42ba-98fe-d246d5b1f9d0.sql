-- Analyze table statistics and missing indexes
-- Check table sizes and row counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Check for missing indexes on foreign key columns
SELECT 
    t.table_name,
    c.column_name,
    c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND (c.column_name LIKE '%_id' OR c.column_name = 'user_id' OR c.column_name = 'discogs_id')
AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = t.table_name 
    AND indexdef LIKE '%' || c.column_name || '%'
)
ORDER BY t.table_name, c.column_name;

-- Check for tables without primary key indexes
SELECT t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = t.table_name
    AND tc.constraint_type = 'PRIMARY KEY'
);

-- Create performance improvement indexes
-- Index for vinyl2_scan queries by user_id and discogs_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vinyl2_scan_user_discogs 
ON vinyl2_scan(user_id, discogs_id) WHERE discogs_id IS NOT NULL;

-- Index for cd_scan queries by user_id and discogs_id  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cd_scan_user_discogs 
ON cd_scan(user_id, discogs_id) WHERE discogs_id IS NOT NULL;

-- Index for ai_scan_results by user_id and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_scan_results_user_status 
ON ai_scan_results(user_id, status);

-- Index for vinyl2_scan created_at for chronological queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vinyl2_scan_created_at 
ON vinyl2_scan(created_at DESC);

-- Index for cd_scan created_at for chronological queries  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cd_scan_created_at 
ON cd_scan(created_at DESC);

-- Index for chat_messages session queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_session_created 
ON chat_messages(session_id, created_at);

-- Index for discogs_pricing_sessions by discogs_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discogs_pricing_sessions_discogs_id 
ON discogs_pricing_sessions(discogs_id);

-- Index for marketplace_listings by user_id and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_user_status 
ON marketplace_listings(user_id, status);

-- Composite index for batch_uploads filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batch_uploads_user_status_type 
ON batch_uploads(user_id, status, media_type);

-- Update table statistics for better query planning
ANALYZE vinyl2_scan;
ANALYZE cd_scan;
ANALYZE ai_scan_results;
ANALYZE chat_messages;
ANALYZE batch_uploads;
ANALYZE marketplace_listings;
ANALYZE discogs_pricing_sessions;