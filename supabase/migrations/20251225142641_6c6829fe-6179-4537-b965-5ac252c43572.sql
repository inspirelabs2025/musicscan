
-- Fix 1: Update artist stories batch from 'active' to 'processing'
UPDATE batch_processing_status
SET status = 'processing', last_heartbeat = NOW()
WHERE id = 'aa13bb7c-6890-41a1-9462-7a4b831a7011';
