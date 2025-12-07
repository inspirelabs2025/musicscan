-- Reset stuck TikTok video queue item to pending for retry
UPDATE tiktok_video_queue 
SET 
  status = 'pending',
  operation_name = NULL,
  attempts = COALESCE(attempts, 0),
  updated_at = now()
WHERE status = 'processing';