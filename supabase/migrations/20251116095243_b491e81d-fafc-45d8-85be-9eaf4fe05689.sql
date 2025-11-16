-- Add metadata column to platform_products table for storing additional button/product information
ALTER TABLE platform_products 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN platform_products.metadata IS 'Additional product metadata such as button size, pin type, and other custom attributes';