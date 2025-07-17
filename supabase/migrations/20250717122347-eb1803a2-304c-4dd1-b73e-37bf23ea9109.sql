-- Add DELETE policy for ai_scan_results table
CREATE POLICY "Allow anonymous delete access" 
ON ai_scan_results 
FOR DELETE 
TO anon 
USING (true);

-- Add audit fields to track manual edits
ALTER TABLE ai_scan_results 
ADD COLUMN IF NOT EXISTS manual_edits jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_by text,
ADD COLUMN IF NOT EXISTS edit_history jsonb DEFAULT '[]';