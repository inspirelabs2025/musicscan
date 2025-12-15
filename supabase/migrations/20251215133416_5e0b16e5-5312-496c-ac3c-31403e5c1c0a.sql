-- Performance fix for shop queries timing out: composite index for the most common filters
-- (status='active', published_at not null, media_type filter, order by created_at desc)
CREATE INDEX IF NOT EXISTS idx_platform_products_active_published_media_created
ON public.platform_products (media_type, created_at DESC)
WHERE (status = 'active' AND published_at IS NOT NULL);

-- Speed up active+p ublished ordering patterns
CREATE INDEX IF NOT EXISTS idx_platform_products_active_published_created
ON public.platform_products (created_at DESC)
WHERE (status = 'active' AND published_at IS NOT NULL);
