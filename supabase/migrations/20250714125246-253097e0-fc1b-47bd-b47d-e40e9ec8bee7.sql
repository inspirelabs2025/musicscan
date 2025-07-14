-- Add Discogs Marketplace fields to cd_scan table
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'For Sale';
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_price NUMERIC;
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_comments TEXT;
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_allow_offers BOOLEAN DEFAULT true;
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_external_id TEXT;
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_location TEXT DEFAULT 'Netherlands';
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_sleeve_condition TEXT;
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_weight INTEGER DEFAULT 100;
ALTER TABLE public.cd_scan ADD COLUMN IF NOT EXISTS marketplace_format_quantity INTEGER DEFAULT 1;

-- Add Discogs Marketplace fields to vinyl2_scan table  
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'For Sale';
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_price NUMERIC;
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_comments TEXT;
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_allow_offers BOOLEAN DEFAULT true;
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_external_id TEXT;
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_location TEXT DEFAULT 'Netherlands';
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_sleeve_condition TEXT;
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_weight INTEGER DEFAULT 230;
ALTER TABLE public.vinyl2_scan ADD COLUMN IF NOT EXISTS marketplace_format_quantity INTEGER DEFAULT 1;