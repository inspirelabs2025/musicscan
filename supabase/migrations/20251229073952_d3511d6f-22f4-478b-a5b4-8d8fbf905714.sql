
-- Remove pending Christmas singles from Facebook queue (Christmas season is over)
DELETE FROM singles_facebook_queue 
WHERE status = 'pending'
AND (single_name ILIKE '%christmas%' 
   OR single_name ILIKE '%kerst%'
   OR single_name ILIKE '%xmas%'
   OR single_name ILIKE '%silent night%'
   OR single_name ILIKE '%jingle%'
   OR single_name ILIKE '%santa%'
   OR single_name ILIKE '%winter wonderland%'
   OR single_name ILIKE '%mary%boy child%'
   OR single_name ILIKE '%frosty%'
   OR single_name ILIKE '%rudolph%'
   OR single_name ILIKE '%white christmas%'
   OR single_name ILIKE '%last christmas%'
   OR single_name ILIKE '%holy night%'
   OR single_name ILIKE '%carol%'
   OR single_name ILIKE '%sleigh%'
   OR single_name ILIKE '%snowman%'
   OR single_name ILIKE '%greatest gift%'
   OR single_name ILIKE '%feliz navidad%'
   OR single_name ILIKE '%deck the halls%'
   OR single_name ILIKE '%joy to the world%'
   OR single_name ILIKE '%have yourself a merry%'
   OR single_name ILIKE '%holly jolly%'
   OR single_name ILIKE '%candy christmas%'
   OR single_name ILIKE '%boy child%'
   OR single_name ILIKE '%save it all for christmas%'
   OR single_name ILIKE '%so this is christmas%'
   OR single_name ILIKE '%there''s no place like home%'
   OR single_name ILIKE '%silver and gold%');

-- Also pause the daily quiz Facebook posting for now (optional cleanup)
DELETE FROM daily_quiz_facebook_queue WHERE status = 'pending';
