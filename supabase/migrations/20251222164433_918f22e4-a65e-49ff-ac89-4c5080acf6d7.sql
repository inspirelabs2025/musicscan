-- Update spotlight_images JSONB field with all uploaded images
UPDATE artist_stories
SET spotlight_images = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'url', image_url,
      'type', CASE WHEN image_source = 'upload' THEN 'artist' ELSE 'album' END,
      'caption', title,
      'alt_text', title
    )
  )
  FROM spotlight_images
  WHERE spotlight_id = 'aa02bd50-b1da-4603-bac8-012eedaf5eb2'
)
WHERE id = 'aa02bd50-b1da-4603-bac8-012eedaf5eb2';