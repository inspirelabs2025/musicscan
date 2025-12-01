-- Add viral sharing columns to quiz_results
ALTER TABLE quiz_results 
ADD COLUMN IF NOT EXISTS share_token VARCHAR(32) UNIQUE,
ADD COLUMN IF NOT EXISTS share_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS badge_earned TEXT;

-- Create index for share_token lookups
CREATE INDEX IF NOT EXISTS idx_quiz_results_share_token ON quiz_results(share_token) WHERE share_token IS NOT NULL;

-- Create quiz_challenges table for head-to-head challenges
CREATE TABLE IF NOT EXISTS quiz_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quiz_result_id UUID REFERENCES quiz_results(id) ON DELETE CASCADE,
  challenge_token VARCHAR(32) UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired')),
  challenger_score INTEGER,
  challenged_score INTEGER,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quiz_type TEXT,
  questions_total INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on quiz_challenges
ALTER TABLE quiz_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz_challenges
CREATE POLICY "Anyone can view challenges by token" ON quiz_challenges
  FOR SELECT USING (true);

CREATE POLICY "Users can create challenges" ON quiz_challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their own challenges" ON quiz_challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_user_id);

-- Create quiz_leaderboard table for rankings
CREATE TABLE IF NOT EXISTS quiz_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  total_quizzes INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  highest_streak INTEGER DEFAULT 0,
  badges_earned JSONB DEFAULT '[]'::jsonb,
  challenges_won INTEGER DEFAULT 0,
  challenges_lost INTEGER DEFAULT 0,
  last_quiz_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz_leaderboard
ALTER TABLE quiz_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz_leaderboard
CREATE POLICY "Anyone can view leaderboard" ON quiz_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own leaderboard entry" ON quiz_leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entry" ON quiz_leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_average_score ON quiz_leaderboard(average_score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_total_quizzes ON quiz_leaderboard(total_quizzes DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_challenges_won ON quiz_leaderboard(challenges_won DESC);

-- Function to update leaderboard after quiz completion
CREATE OR REPLACE FUNCTION update_quiz_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO quiz_leaderboard (user_id, display_name, total_quizzes, total_correct, total_questions, average_score, best_score, last_quiz_at)
  VALUES (
    NEW.user_id,
    (SELECT display_name FROM profiles WHERE user_id = NEW.user_id),
    1,
    NEW.questions_correct,
    NEW.questions_total,
    NEW.score_percentage,
    NEW.score_percentage,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_quizzes = quiz_leaderboard.total_quizzes + 1,
    total_correct = quiz_leaderboard.total_correct + NEW.questions_correct,
    total_questions = quiz_leaderboard.total_questions + NEW.questions_total,
    average_score = ROUND(((quiz_leaderboard.total_correct + NEW.questions_correct)::NUMERIC / (quiz_leaderboard.total_questions + NEW.questions_total)::NUMERIC) * 100, 2),
    best_score = GREATEST(quiz_leaderboard.best_score, NEW.score_percentage),
    last_quiz_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update leaderboard
DROP TRIGGER IF EXISTS trigger_update_quiz_leaderboard ON quiz_results;
CREATE TRIGGER trigger_update_quiz_leaderboard
  AFTER INSERT ON quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_leaderboard();

-- Update RLS policy for quiz_results to allow public viewing by share_token
CREATE POLICY "Anyone can view public quiz results" ON quiz_results
  FOR SELECT USING (is_public = true AND share_token IS NOT NULL);