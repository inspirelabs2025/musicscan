
-- Delete Christmas canvas products that have wrong styling (not warmGrayscale)
DELETE FROM platform_products 
WHERE 'CANVAS' = ANY(categories) 
  AND id IN (
    '7dd768a5-08de-43b9-9b7c-57ddd751621d', -- Backstreet Boys
    '3780f9c4-eee2-415a-b634-c72ca1ea20f7', -- Ava Max
    '28010380-73bd-475e-9574-5ab4d1054f0a', -- Ariana Grande
    '066cab1a-be62-4bab-b4b7-a5d6b15ce28b', -- Andy Williams
    '92439334-65db-470c-9d14-08473b987c99', -- André Rieu
    '841fe811-e81e-42f7-af27-353f5a4bf276'  -- Little Richard
  );

-- Clear product_ids in christmas_import_queue so they get reprocessed
UPDATE christmas_import_queue 
SET product_ids = NULL 
WHERE music_story_id IN (
  SELECT id FROM music_stories 
  WHERE (yaml_frontmatter->>'is_christmas')::boolean = true
    AND artwork_url IS NOT NULL
);
