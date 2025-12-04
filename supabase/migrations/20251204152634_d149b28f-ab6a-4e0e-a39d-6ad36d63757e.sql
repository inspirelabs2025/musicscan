-- Sync existing daily challenge results to quiz_results table
INSERT INTO quiz_results (user_id, quiz_type, questions_correct, questions_total, score_percentage, time_taken_seconds, created_at)
SELECT 
  dcr.user_id,
  'daily' as quiz_type,
  dcr.score as questions_correct,
  10 as questions_total,
  (dcr.score * 10) as score_percentage,
  dcr.time_taken_seconds,
  dcr.created_at
FROM daily_challenge_results dcr
WHERE NOT EXISTS (
  SELECT 1 FROM quiz_results qr 
  WHERE qr.user_id = dcr.user_id 
    AND qr.quiz_type = 'daily' 
    AND DATE(qr.created_at) = DATE(dcr.created_at)
);