-- Christmas Import Queue (basis voor alle content)
CREATE TABLE public.christmas_import_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist TEXT NOT NULL,
  song_title TEXT NOT NULL,
  album TEXT,
  year INTEGER,
  content_type TEXT DEFAULT 'song',
  genre TEXT DEFAULT 'Christmas',
  chart_peak INTEGER,
  chart_country TEXT,
  country_origin TEXT,
  decade TEXT,
  is_classic BOOLEAN DEFAULT false,
  is_dutch BOOLEAN DEFAULT false,
  royalty_estimate DECIMAL,
  youtube_video_id TEXT,
  lyrics TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'pending',
  music_story_id UUID,
  anecdote_id UUID,
  product_ids UUID[],
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Advent Kalender Content
CREATE TABLE public.christmas_advent_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 24),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_data JSONB,
  image_url TEXT,
  is_unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(day_number, year)
);

-- Kerst Polls
CREATE TABLE public.christmas_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  poll_type TEXT DEFAULT 'single',
  options JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.christmas_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.christmas_polls(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  selected_options JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memory Game Scores
CREATE TABLE public.christmas_memory_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  difficulty TEXT DEFAULT 'medium',
  moves INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Karaoke Lyrics
CREATE TABLE public.christmas_karaoke_lyrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist TEXT NOT NULL,
  song_title TEXT NOT NULL,
  lyrics_lines JSONB,
  language TEXT DEFAULT 'en',
  has_timing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gift Guide Items
CREATE TABLE public.christmas_gift_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_range TEXT,
  product_ids UUID[],
  external_links JSONB,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.christmas_import_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.christmas_advent_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.christmas_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.christmas_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.christmas_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.christmas_karaoke_lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.christmas_gift_guide ENABLE ROW LEVEL SECURITY;

-- Public read for advent, polls, karaoke, gift guide
CREATE POLICY "Public can view advent calendar" ON public.christmas_advent_calendar FOR SELECT USING (true);
CREATE POLICY "Public can view polls" ON public.christmas_polls FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view karaoke lyrics" ON public.christmas_karaoke_lyrics FOR SELECT USING (true);
CREATE POLICY "Public can view gift guide" ON public.christmas_gift_guide FOR SELECT USING (is_active = true);

-- Anyone can vote (one per session)
CREATE POLICY "Anyone can vote" ON public.christmas_poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view votes" ON public.christmas_poll_votes FOR SELECT USING (true);

-- Anyone can submit memory scores
CREATE POLICY "Anyone can submit scores" ON public.christmas_memory_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view scores" ON public.christmas_memory_scores FOR SELECT USING (true);

-- Admin policies for import queue
CREATE POLICY "Admins can manage import queue" ON public.christmas_import_queue FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage advent" ON public.christmas_advent_calendar FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage polls" ON public.christmas_polls FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage karaoke" ON public.christmas_karaoke_lyrics FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage gift guide" ON public.christmas_gift_guide FOR ALL USING (public.is_admin(auth.uid()));

-- System access for edge functions
CREATE POLICY "System can manage import queue" ON public.christmas_import_queue FOR ALL USING (true);

-- Insert test song
INSERT INTO public.christmas_import_queue (
  artist, song_title, album, year, 
  country_origin, decade, is_classic, 
  youtube_video_id, tags
) VALUES (
  'Wham!', 
  'Last Christmas', 
  'Music from the Edge of Heaven', 
  1984,
  'UK',
  '1980s',
  true,
  'E8gmARGvPlI',
  ARRAY['christmas', 'kerst', '80s', 'classic', 'uk']
);