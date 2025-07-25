-- Drop the problematic foreign key constraint
ALTER TABLE public.ai_scan_results DROP CONSTRAINT IF EXISTS ai_scan_results_user_id_fkey;

-- Add the constraint back but referencing auth.users correctly
-- We'll make it reference auth.users(id) but allow for some flexibility
ALTER TABLE public.ai_scan_results 
ADD CONSTRAINT ai_scan_results_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;