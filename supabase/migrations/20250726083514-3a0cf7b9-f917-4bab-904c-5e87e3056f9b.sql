-- Add shop and public collection columns to existing tables
ALTER TABLE cd_scan 
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN is_for_sale boolean DEFAULT false,
ADD COLUMN shop_description text;

ALTER TABLE vinyl2_scan 
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN is_for_sale boolean DEFAULT false,
ADD COLUMN shop_description text;

-- Create user_shops table for shop configuration
CREATE TABLE user_shops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  shop_name text,
  shop_description text,
  is_public boolean DEFAULT false,
  contact_info text,
  shop_url_slug text UNIQUE,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for user_shops
ALTER TABLE user_shops ENABLE ROW LEVEL SECURITY;

-- Create policies for user_shops
CREATE POLICY "Users can view their own shop"
ON user_shops FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shop"
ON user_shops FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shop"
ON user_shops FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Public shops are viewable by everyone"
ON user_shops FOR SELECT
USING (is_public = true);

-- Create public_collections table for tracking public collections
CREATE TABLE public_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  collection_name text,
  is_public boolean DEFAULT false,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for public_collections
ALTER TABLE public_collections ENABLE ROW LEVEL SECURITY;

-- Create policies for public_collections
CREATE POLICY "Users can manage their own collection settings"
ON public_collections FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Public collections are viewable by everyone"
ON public_collections FOR SELECT
USING (is_public = true);

-- Add trigger for updated_at columns
CREATE TRIGGER update_user_shops_updated_at
BEFORE UPDATE ON user_shops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_collections_updated_at
BEFORE UPDATE ON public_collections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();