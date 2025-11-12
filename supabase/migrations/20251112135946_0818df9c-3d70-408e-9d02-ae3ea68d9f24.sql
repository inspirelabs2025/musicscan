-- Create singles_import_queue table for batch processing of singles
CREATE TABLE singles_import_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  artist TEXT NOT NULL,
  single_name TEXT NOT NULL,
  album TEXT,
  year INTEGER,
  label TEXT,
  catalog TEXT,
  discogs_id INTEGER,
  discogs_url TEXT,
  artwork_url TEXT,
  genre TEXT,
  styles TEXT[],
  tags TEXT[],
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  music_story_id UUID REFERENCES music_stories(id),
  
  -- Batch tracking
  batch_id UUID NOT NULL,
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_singles_queue_batch_id ON singles_import_queue(batch_id);
CREATE INDEX idx_singles_queue_status ON singles_import_queue(status);
CREATE INDEX idx_singles_queue_user_id ON singles_import_queue(user_id);
CREATE INDEX idx_singles_queue_pending ON singles_import_queue(status, priority DESC, created_at ASC) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE singles_import_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own singles queue items"
  ON singles_import_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own singles queue items"
  ON singles_import_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own singles queue items"
  ON singles_import_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own singles queue items"
  ON singles_import_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_singles_queue_updated_at
  BEFORE UPDATE ON singles_import_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();