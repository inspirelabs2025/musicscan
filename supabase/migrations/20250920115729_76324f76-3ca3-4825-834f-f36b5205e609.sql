-- Clean up current batch state and queue
UPDATE batch_processing_status 
SET status = 'idle', 
    total_items = 0,
    processed_items = 0,
    successful_items = 0,
    failed_items = 0,
    queue_size = 0,
    current_batch = NULL,
    current_items = NULL,
    failed_details = NULL,
    completed_at = NULL,
    stopped_at = NULL,
    updated_at = now()
WHERE process_type = 'blog_generation';

-- Clear all queue items
DELETE FROM batch_queue_items;