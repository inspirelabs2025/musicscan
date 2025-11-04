-- Allow text/html uploads in the existing 'sitemaps' storage bucket and keep it public
UPDATE storage.buckets
SET 
  allowed_mime_types = (
    SELECT array_agg(DISTINCT v)
    FROM unnest(COALESCE(allowed_mime_types, ARRAY[]::text[]) || ARRAY['text/html']) AS v
  ),
  public = TRUE
WHERE id = 'sitemaps';
