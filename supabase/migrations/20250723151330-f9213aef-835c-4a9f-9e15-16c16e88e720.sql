-- Update all vinyl scans from today (2025-07-23) to CD
UPDATE ai_scan_results 
SET 
  media_type = 'cd',
  updated_at = now()
WHERE 
  media_type = 'vinyl' 
  AND DATE(created_at) = '2025-07-23';