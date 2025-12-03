-- Quiz categorieën tabel
CREATE TABLE public.quiz_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  difficulty TEXT DEFAULT 'medium',
  question_count INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view quiz categories
CREATE POLICY "Quiz categories viewable by everyone"
ON public.quiz_categories FOR SELECT
USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage quiz categories"
ON public.quiz_categories FOR ALL
USING (is_admin(auth.uid()));

-- Seed quiz categories
INSERT INTO public.quiz_categories (name, slug, icon, description, difficulty, question_count) VALUES
('Mijn Collectie', 'collectie', 'disc3', 'Quiz over jouw muziekcollectie', 'medium', 10),
('Artiesten Quiz', 'artiesten', 'users', 'Test je kennis van artiesten', 'medium', 10),
('Album Quiz', 'albums', 'album', 'Hoeveel weet je van albums?', 'medium', 10),
('Nederlandse Muziek', 'nederland', 'flag', 'Nederlandse muziekgeschiedenis', 'medium', 10),
('Franse Muziek', 'frankrijk', 'flag', 'Franse muziekgeschiedenis', 'medium', 10),
('Dance & House', 'dance-house', 'headphones', 'Electronic muziek kennis', 'medium', 10),
('Decennia Quiz', 'decennia', 'calendar', 'Per tijdperk quizzen', 'medium', 10),
('Speed Round', 'speed', 'zap', 'Snelle 5-vragen quiz', 'easy', 5),
('Dagelijkse Challenge', 'daily', 'target', 'Compete met anderen', 'hard', 15);

-- Daily challenges tabel
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  quiz_data JSONB NOT NULL,
  category_mix TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily challenges viewable by everyone"
ON public.daily_challenges FOR SELECT
USING (true);

CREATE POLICY "System can manage daily challenges"
ON public.daily_challenges FOR ALL
USING (true);

-- Daily challenge results
CREATE TABLE public.daily_challenge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.daily_challenge_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all daily results"
ON public.daily_challenge_results FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own results"
ON public.daily_challenge_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Extend quiz_leaderboard with points and streak columns
ALTER TABLE public.quiz_leaderboard 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS favorite_category TEXT,
ADD COLUMN IF NOT EXISTS badges_earned TEXT[] DEFAULT '{}';