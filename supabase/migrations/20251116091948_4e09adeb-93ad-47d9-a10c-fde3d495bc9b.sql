-- Add index for better performance when querying buttons category
CREATE INDEX IF NOT EXISTS idx_platform_products_buttons 
ON platform_products(media_type, categories) 
WHERE media_type = 'merchandise' 
AND categories && ARRAY['buttons', 'badges'];

-- Add comment for documentation
COMMENT ON INDEX idx_platform_products_buttons IS 'Index for filtering button/badge products in platform_products table';
