-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create batch queue items table for individual processing
CREATE TABLE IF NOT EXISTS public.batch_queue_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID NOT NULL,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL, -- 'cd', 'vinyl', 'ai'
    priority INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'skipped'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_queue_items_status ON public.batch_queue_items(status);
CREATE INDEX IF NOT EXISTS idx_batch_queue_items_batch_id ON public.batch_queue_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_queue_items_priority ON public.batch_queue_items(priority DESC, created_at ASC);

-- Enable RLS on the new table
ALTER TABLE public.batch_queue_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "System can manage batch queue items" ON public.batch_queue_items
FOR ALL USING (true);

-- Update batch_processing_status to support the new system
ALTER TABLE public.batch_processing_status 
ADD COLUMN IF NOT EXISTS queue_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_mode BOOLEAN DEFAULT true;

-- Create the cron job to process batch items every minute
-- This will call our new batch-blog-processor function
SELECT cron.schedule(
    'batch-blog-processor-cron',
    '* * * * *', -- Every minute
    $$
    SELECT
        net.http_post(
            url:='https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/batch-blog-processor',
            headers:='{"Content-Type": "application/json"}'::jsonb,
            body:='{"cron": true}'::jsonb
        ) as request_id;
    $$
);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_batch_queue_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_batch_queue_items_updated_at
    BEFORE UPDATE ON public.batch_queue_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_batch_queue_items_updated_at();