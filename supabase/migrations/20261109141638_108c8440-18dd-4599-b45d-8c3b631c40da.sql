ALTER TABLE public.marketplace_listings DROP CONSTRAINT IF EXISTS marketplace_listings_vehicle_part_id_fkey;

DROP TABLE IF EXISTS public.part_valuations;
DROP TABLE IF EXISTS public.part_scans;
DROP TABLE IF EXISTS public.vehicle_parts;
DROP TABLE IF EXISTS public.vehicles;
DROP TABLE IF EXISTS public.part_categories;
DROP TABLE IF EXISTS public.oem_numbers;
DROP TABLE IF EXISTS public.rdw_lookups;
DROP TABLE IF EXISTS public.tecdoc_matches;
DROP TABLE IF EXISTS public.demand_analytics;
DROP TABLE IF EXISTS public.market_prices;