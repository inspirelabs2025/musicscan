-- Create shop orders table
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL,
  shipping_cost NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  buyer_email TEXT,
  buyer_name TEXT,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop order items table
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'cd_scan' or 'vinyl2_scan'
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  item_data JSONB, -- Snapshot of item data at time of order
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop transactions table for tracking payments
CREATE TABLE IF NOT EXISTS public.shop_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_charge_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sold_at and sold_to columns to existing scan tables
ALTER TABLE public.cd_scan 
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sold_to UUID,
ADD COLUMN IF NOT EXISTS order_id UUID;

ALTER TABLE public.vinyl2_scan 
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sold_to UUID,
ADD COLUMN IF NOT EXISTS order_id UUID;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_orders_buyer_id ON public.shop_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_seller_id ON public.shop_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON public.shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order_id ON public.shop_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shop_transactions_order_id ON public.shop_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_cd_scan_sold_at ON public.cd_scan(sold_at);
CREATE INDEX IF NOT EXISTS idx_vinyl2_scan_sold_at ON public.vinyl2_scan(sold_at);

-- Enable RLS on new tables
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_orders
CREATE POLICY "Users can view orders they are involved in" ON public.shop_orders
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create orders as buyers" ON public.shop_orders
FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own orders" ON public.shop_orders
FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS policies for shop_order_items
CREATE POLICY "Users can view order items they are involved in" ON public.shop_order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shop_orders 
    WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "Users can create order items for their orders" ON public.shop_order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shop_orders 
    WHERE id = order_id AND buyer_id = auth.uid()
  )
);

-- RLS policies for shop_transactions
CREATE POLICY "Users can view transactions they are involved in" ON public.shop_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shop_orders 
    WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "System can manage transactions" ON public.shop_transactions
FOR ALL USING (true);

-- Function to update shop orders timestamp
CREATE OR REPLACE FUNCTION public.update_shop_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updating shop orders timestamp
CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shop_orders_updated_at();