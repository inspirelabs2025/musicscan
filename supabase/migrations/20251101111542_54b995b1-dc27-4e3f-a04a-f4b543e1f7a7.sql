-- ============================================
-- PLATFORM SHOP DATABASE SETUP
-- ============================================

-- 1. CREATE PLATFORM_PRODUCTS TABLE
-- ============================================
CREATE TABLE platform_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product basis info
  title text NOT NULL,
  artist text,
  description text,
  long_description text,
  
  -- Media details
  media_type text NOT NULL CHECK (media_type IN ('cd', 'vinyl', 'merchandise', 'book', 'accessory', 'boxset')),
  format text,
  condition_grade text CHECK (condition_grade IN ('Sealed', 'M', 'NM', 'VG+', 'VG', 'G+', 'G')),
  
  -- Pricing
  price numeric NOT NULL CHECK (price >= 0),
  compare_at_price numeric CHECK (compare_at_price >= price),
  cost_price numeric,
  currency text DEFAULT 'EUR',
  
  -- Inventory
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold integer DEFAULT 5,
  allow_backorder boolean DEFAULT false,
  sku text UNIQUE,
  
  -- Media & SEO
  images text[] DEFAULT '{}',
  primary_image text,
  slug text UNIQUE NOT NULL,
  meta_title text,
  meta_description text,
  
  -- Discogs linking
  discogs_id integer,
  discogs_url text,
  release_id uuid REFERENCES releases(id),
  
  -- Categorization & Search
  categories text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  genre text,
  label text,
  catalog_number text,
  year integer,
  country text,
  
  -- Shop features
  is_featured boolean DEFAULT false,
  is_on_sale boolean DEFAULT false,
  is_new boolean DEFAULT false,
  featured_until timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  published_at timestamptz,
  
  -- Stats
  view_count integer DEFAULT 0,
  purchase_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  last_purchased_at timestamptz,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'sold_out'))
);

-- Indexes
CREATE INDEX idx_platform_products_status ON platform_products(status) WHERE status = 'active';
CREATE INDEX idx_platform_products_media_type ON platform_products(media_type);
CREATE INDEX idx_platform_products_featured ON platform_products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_platform_products_slug ON platform_products(slug);
CREATE INDEX idx_platform_products_categories ON platform_products USING gin(categories);
CREATE INDEX idx_platform_products_tags ON platform_products USING gin(tags);
CREATE INDEX idx_platform_products_price ON platform_products(price);
CREATE INDEX idx_platform_products_created_at ON platform_products(created_at DESC);
CREATE INDEX idx_platform_products_discogs_id ON platform_products(discogs_id) WHERE discogs_id IS NOT NULL;
CREATE INDEX idx_platform_products_search ON platform_products 
  USING gin(to_tsvector('dutch', coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(description, '')));

-- 2. RLS POLICIES FOR PLATFORM_PRODUCTS
-- ============================================
ALTER TABLE platform_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active platform products are viewable by everyone" 
  ON platform_products 
  FOR SELECT 
  USING (
    status = 'active' 
    AND published_at IS NOT NULL 
    AND published_at <= now()
    AND stock_quantity > 0
  );

CREATE POLICY "Admins can view all platform products" 
  ON platform_products 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert platform products" 
  ON platform_products 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update platform products" 
  ON platform_products 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete platform products" 
  ON platform_products 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));

-- 3. DATABASE FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_products_updated_at
  BEFORE UPDATE ON platform_products
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_products_updated_at();

-- Auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_product_slug(p_title text, p_artist text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(
    regexp_replace(
      trim(coalesce(p_artist, '') || ' ' || p_title), 
      '[^a-zA-Z0-9\s]', '', 'g'
    )
  );
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug from 1 for 80);
  final_slug := base_slug;
  
  WHILE EXISTS(SELECT 1 FROM platform_products WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_product_view(p_product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE platform_products 
  SET 
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update stock after purchase
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_quantity integer DEFAULT 1)
RETURNS boolean AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM platform_products
  WHERE id = p_product_id;
  
  IF current_stock < p_quantity THEN
    RETURN false;
  END IF;
  
  UPDATE platform_products 
  SET 
    stock_quantity = stock_quantity - p_quantity,
    purchase_count = purchase_count + p_quantity,
    last_purchased_at = now(),
    status = CASE 
      WHEN stock_quantity - p_quantity <= 0 THEN 'sold_out'
      ELSE status
    END
  WHERE id = p_product_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search products (full-text search)
CREATE OR REPLACE FUNCTION search_platform_products(
  search_query text,
  p_media_type text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  artist text,
  price numeric,
  primary_image text,
  slug text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.artist,
    p.price,
    p.primary_image,
    p.slug,
    ts_rank(
      to_tsvector('dutch', coalesce(p.title, '') || ' ' || coalesce(p.artist, '') || ' ' || coalesce(p.description, '')),
      plainto_tsquery('dutch', search_query)
    ) as rank
  FROM platform_products p
  WHERE 
    p.status = 'active'
    AND p.published_at IS NOT NULL
    AND p.stock_quantity > 0
    AND (p_media_type IS NULL OR p.media_type = p_media_type)
    AND (p_category IS NULL OR p_category = ANY(p.categories))
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND to_tsvector('dutch', coalesce(p.title, '') || ' ' || coalesce(p.artist, '') || ' ' || coalesce(p.description, '')) 
        @@ plainto_tsquery('dutch', search_query)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. PLATFORM ORDERS TABLES
-- ============================================
CREATE TABLE platform_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer info
  customer_id uuid REFERENCES auth.users(id),
  customer_email text NOT NULL,
  customer_name text,
  
  -- Shipping address
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  
  -- Order details
  order_number text UNIQUE NOT NULL,
  subtotal numeric NOT NULL,
  shipping_cost numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric NOT NULL,
  currency text DEFAULT 'EUR',
  
  -- Payment
  stripe_session_id text,
  stripe_payment_intent_id text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  
  -- Fulfillment
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_number text,
  carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  
  -- Notes
  customer_note text,
  admin_note text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE platform_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES platform_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES platform_products(id),
  
  title text NOT NULL,
  artist text,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  product_snapshot jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_platform_orders_customer ON platform_orders(customer_id);
CREATE INDEX idx_platform_orders_status ON platform_orders(status);
CREATE INDEX idx_platform_orders_created_at ON platform_orders(created_at DESC);
CREATE INDEX idx_platform_order_items_order ON platform_order_items(order_id);
CREATE INDEX idx_platform_order_items_product ON platform_order_items(product_id);

-- 5. RLS POLICIES FOR ORDERS
-- ============================================
ALTER TABLE platform_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON platform_orders FOR SELECT
  USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all orders"
  ON platform_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their order items"
  ON platform_order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM platform_orders 
      WHERE customer_id = auth.uid() OR has_role(auth.uid(), 'admin')
    )
  );

-- 6. ORDER NUMBER GENERATOR
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  year_prefix text := 'PO-' || to_char(now(), 'YYYY') || '-';
  max_num integer;
  new_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS integer)), 0) INTO max_num
  FROM platform_orders
  WHERE order_number LIKE year_prefix || '%';
  
  new_num := year_prefix || LPAD((max_num + 1)::text, 5, '0');
  RETURN new_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_platform_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_platform_order_number
  BEFORE INSERT ON platform_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_platform_order_number();