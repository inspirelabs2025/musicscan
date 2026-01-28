-- Add release_id column to ai_scan_results for linking to central releases table
ALTER TABLE ai_scan_results 
ADD COLUMN release_id UUID REFERENCES releases(id);

-- Create index for efficient queries
CREATE INDEX idx_ai_scan_release ON ai_scan_results(release_id);