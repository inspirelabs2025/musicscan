-- Update status check constraint to include 'no_exact_match' status
ALTER TABLE public.ai_scan_results 
DROP CONSTRAINT ai_scan_results_status_check;

ALTER TABLE public.ai_scan_results 
ADD CONSTRAINT ai_scan_results_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'no_exact_match'::text]));