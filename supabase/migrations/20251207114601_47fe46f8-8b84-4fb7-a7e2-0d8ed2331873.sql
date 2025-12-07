-- Reset TikTok queue item voor KMFDM naar pending status
UPDATE tiktok_video_queue 
SET status = 'pending', 
    attempts = 0, 
    error_message = NULL,
    operation_name = NULL,
    updated_at = now()
WHERE id = 'ab3d6fce-560a-46ab-9dbf-4513c16897f5';