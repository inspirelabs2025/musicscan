-- Fix the update_quiz_leaderboard trigger to use first_name instead of display_name
CREATE OR REPLACE FUNCTION public.update_quiz_leaderboard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO quiz_leaderboard (user_id, display_name, total_quizzes, total_correct, total_questions, average_score, best_score, last_quiz_at)
  VALUES (
    NEW.user_id,
    (SELECT first_name FROM profiles WHERE user_id = NEW.user_id),
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
$function$;