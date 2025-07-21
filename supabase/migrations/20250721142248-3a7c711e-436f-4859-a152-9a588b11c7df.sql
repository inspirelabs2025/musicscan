
-- Add comments column to ai_scan_results table
ALTER TABLE ai_scan_results 
ADD COLUMN comments TEXT;

-- Add index for better query performance when filtering on comments
CREATE INDEX idx_ai_scan_results_comments ON ai_scan_results(comments) WHERE comments IS NOT NULL;
