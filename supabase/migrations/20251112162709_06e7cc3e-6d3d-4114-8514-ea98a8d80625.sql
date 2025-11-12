-- Add metadata column to batch_queue_items for flexible data storage
ALTER TABLE batch_queue_items 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_batch_queue_items_metadata ON batch_queue_items USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN batch_queue_items.metadata IS 'Flexible JSON storage for item-specific data (e.g., artist_name, photo_url, single_name, etc.)';