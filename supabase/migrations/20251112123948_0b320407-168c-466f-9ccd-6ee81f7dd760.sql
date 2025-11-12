-- Drop unique constraint to allow multiple anecdotes per day
ALTER TABLE public.music_anecdotes
  DROP CONSTRAINT IF EXISTS music_anecdotes_anecdote_date_key;

-- Keep helpful index for fetching today's anecdote efficiently (already exists), ensure it remains
-- CREATE INDEX IF NOT EXISTS idx_anecdotes_date ON public.music_anecdotes(anecdote_date DESC) WHERE is_active = true; -- (index already present as per introspection)
