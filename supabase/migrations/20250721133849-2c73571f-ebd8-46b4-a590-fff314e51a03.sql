
-- Add column to mark AI scan results as flagged incorrect
ALTER TABLE ai_scan_results 
ADD COLUMN is_flagged_incorrect BOOLEAN DEFAULT FALSE;

-- Add index for better query performance on flagged scans
CREATE INDEX idx_ai_scan_results_flagged ON ai_scan_results(is_flagged_incorrect) WHERE is_flagged_incorrect = TRUE;
