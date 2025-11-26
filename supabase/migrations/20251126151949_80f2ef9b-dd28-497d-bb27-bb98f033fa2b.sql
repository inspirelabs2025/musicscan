-- Drop the old find_or_create_release function (12 parameters) to resolve conflict
DROP FUNCTION IF EXISTS public.find_or_create_release(integer, text, text, text, text, integer, text, text, text, text[], text, integer);

-- Verify the new function (13 parameters with p_artwork_url) exists
-- This should remain and be the only version
COMMENT ON FUNCTION public.find_or_create_release(integer, text, text, text, text, integer, text, text, text, text[], text, integer, text) IS 'Updated function with artwork_url parameter - resolved conflict with old 12-param version';