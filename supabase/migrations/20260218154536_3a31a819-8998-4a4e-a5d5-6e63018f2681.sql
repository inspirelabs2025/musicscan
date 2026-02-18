
-- Table for Discogs marketplace orders
CREATE TABLE public.discogs_orders (
  id TEXT NOT NULL,
  user_id UUID NOT NULL,
  discogs_order_id TEXT NOT NULL,
  buyer_username TEXT,
  buyer_email TEXT,
  seller_username TEXT,
  status TEXT,
  total_value NUMERIC(10,2),
  total_currency TEXT DEFAULT 'EUR',
  shipping_value NUMERIC(10,2),
  shipping_method TEXT,
  shipping_address TEXT,
  fee_value NUMERIC(10,2),
  fee_currency TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  tracking_carrier TEXT,
  items JSONB,
  additional_instructions TEXT,
  archived BOOLEAN DEFAULT false,
  discogs_created_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Add unique constraint
ALTER TABLE public.discogs_orders ADD CONSTRAINT discogs_orders_user_order_unique UNIQUE (user_id, discogs_order_id);

-- Table for order messages
CREATE TABLE public.discogs_order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discogs_order_id TEXT NOT NULL,
  sender_username TEXT,
  message TEXT,
  subject TEXT,
  original TEXT,
  status_id INTEGER,
  message_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate messages
ALTER TABLE public.discogs_order_messages ADD CONSTRAINT discogs_messages_unique UNIQUE (discogs_order_id, sender_username, message_timestamp);

-- Enable RLS
ALTER TABLE public.discogs_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discogs_order_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see their own data
CREATE POLICY "Users can view own orders" ON public.discogs_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.discogs_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.discogs_orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON public.discogs_order_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.discogs_order_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_discogs_orders_user ON public.discogs_orders(user_id);
CREATE INDEX idx_discogs_orders_status ON public.discogs_orders(status);
CREATE INDEX idx_discogs_messages_order ON public.discogs_order_messages(discogs_order_id);
CREATE INDEX idx_discogs_messages_user ON public.discogs_order_messages(user_id);

-- Updated_at trigger
CREATE TRIGGER update_discogs_orders_updated_at
  BEFORE UPDATE ON public.discogs_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
