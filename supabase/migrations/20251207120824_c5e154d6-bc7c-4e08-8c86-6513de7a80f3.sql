UPDATE tiktok_video_queue 
SET status = 'pending', attempts = 0, error_message = NULL, operation_name = NULL, updated_at = now()
WHERE status = 'processing' OR status = 'failed';