-- Make buyer_id nullable and add RLS policy for guest orders
ALTER TABLE shop_orders ALTER COLUMN buyer_id DROP NOT NULL;

-- Add RLS policy for guest order creation
CREATE POLICY "Guest users can create orders" 
ON shop_orders 
FOR INSERT 
WITH CHECK (buyer_id IS NULL AND buyer_email IS NOT NULL);

-- Add RLS policy for guest order viewing via order tracking
CREATE POLICY "Guest users can view their orders via email and order ID" 
ON shop_orders 
FOR SELECT 
USING (
  (auth.uid() = buyer_id) OR 
  (auth.uid() = seller_id) OR 
  (buyer_id IS NULL AND buyer_email IS NOT NULL)
);

-- Update existing policy to handle null buyer_id
DROP POLICY IF EXISTS "Users can view orders they are involved in" ON shop_orders;
CREATE POLICY "Users can view orders they are involved in" 
ON shop_orders 
FOR SELECT 
USING (
  (auth.uid() = buyer_id) OR 
  (auth.uid() = seller_id) OR 
  (buyer_id IS NULL AND buyer_email IS NOT NULL)
);