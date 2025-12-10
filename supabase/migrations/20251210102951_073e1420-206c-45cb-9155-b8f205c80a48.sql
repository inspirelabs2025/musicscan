-- Reset stuck running jobs back to pending
UPDATE render_jobs 
SET status = 'pending', worker_id = NULL 
WHERE status = 'running';
