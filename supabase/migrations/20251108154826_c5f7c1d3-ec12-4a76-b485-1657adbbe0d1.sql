-- Create poster processing queue table
CREATE TABLE IF NOT EXISTS poster_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  product_id UUID REFERENCES platform_products(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poster_queue_status ON poster_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_poster_queue_created ON poster_processing_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_poster_queue_artist ON poster_processing_queue(artist_name);

-- Enable RLS
ALTER TABLE poster_processing_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view poster queue"
  ON poster_processing_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create poster queue items"
  ON poster_processing_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update poster queue"
  ON poster_processing_queue FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete poster queue items"
  ON poster_processing_queue FOR DELETE
  TO authenticated
  USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_poster_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER poster_queue_updated_at
  BEFORE UPDATE ON poster_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_poster_queue_updated_at();