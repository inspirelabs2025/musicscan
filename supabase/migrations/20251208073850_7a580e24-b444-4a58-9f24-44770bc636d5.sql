-- Drop old constraint and add new one with ready_for_client status
ALTER TABLE tiktok_video_queue DROP CONSTRAINT tiktok_video_queue_status_check;

ALTER TABLE tiktok_video_queue ADD CONSTRAINT tiktok_video_queue_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'ready_for_client'::text, 'processing'::text, 'completed'::text, 'failed'::text]));