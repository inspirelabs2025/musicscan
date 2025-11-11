-- Create table for daily music history events
CREATE TABLE public.music_history_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  day_of_month INTEGER NOT NULL,
  month_of_year INTEGER NOT NULL,
  events JSONB NOT NULL, -- Array of events: [{year, title, description, image_url?}]
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_history_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read music history events
CREATE POLICY "Music history events are publicly readable"
  ON public.music_history_events
  FOR SELECT
  USING (true);

-- Index for fast lookups by date
CREATE INDEX idx_music_history_events_date ON public.music_history_events(event_date DESC);
CREATE INDEX idx_music_history_events_day_month ON public.music_history_events(day_of_month, month_of_year);

-- Unique constraint to ensure one entry per date
CREATE UNIQUE INDEX idx_music_history_events_unique_date ON public.music_history_events(event_date);