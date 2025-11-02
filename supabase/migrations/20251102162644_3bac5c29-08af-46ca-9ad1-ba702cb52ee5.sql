-- Add master_id column to platform_products to store master ID separately from release ID
ALTER TABLE platform_products
ADD COLUMN IF NOT EXISTS master_id INTEGER;

COMMENT ON COLUMN platform_products.master_id IS 'Discogs Master ID (for grouping releases)';
COMMENT ON COLUMN platform_products.discogs_id IS 'Discogs Release ID (specific pressing)';