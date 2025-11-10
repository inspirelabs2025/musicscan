-- Create music anecdotes table for daily generated music stories
CREATE TABLE music_anecdotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  anecdote_date date UNIQUE NOT NULL,
  subject_type text NOT NULL,
  subject_name text NOT NULL,
  subject_details jsonb,
  anecdote_title text NOT NULL,
  anecdote_content text NOT NULL,
  source_reference text,
  is_active boolean DEFAULT true,
  views_count integer DEFAULT 0
);

-- Index for fast queries of active anecdotes
CREATE INDEX idx_anecdotes_date ON music_anecdotes(anecdote_date DESC) WHERE is_active = true;

-- Enable RLS
ALTER TABLE music_anecdotes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active anecdotes"
  ON music_anecdotes FOR SELECT
  USING (is_active = true);

-- System can insert (edge function with service role)
CREATE POLICY "System can insert anecdotes"
  ON music_anecdotes FOR INSERT
  WITH CHECK (true);

-- System can update
CREATE POLICY "System can update anecdotes"
  ON music_anecdotes FOR UPDATE
  USING (true);