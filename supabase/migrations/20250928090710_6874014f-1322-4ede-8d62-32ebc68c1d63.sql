-- Create table to track shown Discogs releases and prevent duplicates
CREATE TABLE public.discogs_releases_shown (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discogs_id integer UNIQUE NOT NULL,
  artist text NOT NULL,
  title text NOT NULL,
  first_shown_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone DEFAULT now(),
  times_shown integer DEFAULT 1,
  is_hidden boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discogs_releases_shown ENABLE ROW LEVEL SECURITY;

-- Create policies for the tracking table
CREATE POLICY "Discogs releases shown are viewable by everyone" 
ON public.discogs_releases_shown 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert discogs releases shown" 
ON public.discogs_releases_shown 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update discogs releases shown" 
ON public.discogs_releases_shown 
FOR UPDATE 
USING (true);

-- Create index for performance
CREATE INDEX idx_discogs_releases_shown_discogs_id ON public.discogs_releases_shown(discogs_id);
CREATE INDEX idx_discogs_releases_shown_first_shown_at ON public.discogs_releases_shown(first_shown_at);

-- Add trigger for updated_at
CREATE TRIGGER update_discogs_releases_shown_updated_at
BEFORE UPDATE ON public.discogs_releases_shown
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();