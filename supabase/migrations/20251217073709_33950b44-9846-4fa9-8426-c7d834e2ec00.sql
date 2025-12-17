-- Create RPC function to get distinct years from top2000_entries
CREATE OR REPLACE FUNCTION get_distinct_top2000_years()
RETURNS TABLE (year integer) 
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT year FROM top2000_entries ORDER BY year;
$$;