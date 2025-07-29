-- Fix RLS policies for ai_scan_results to work with client-side authentication
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own scans" ON ai_scan_results;
DROP POLICY IF EXISTS "Users can create their own scans" ON ai_scan_results;
DROP POLICY IF EXISTS "Users can update their own scans" ON ai_scan_results;
DROP POLICY IF EXISTS "Users can delete their own scans" ON ai_scan_results;

-- Create new policies that work with client authentication
CREATE POLICY "Users can view their own scans" 
ON ai_scan_results 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN auth.uid() = user_id
    ELSE true
  END
);

CREATE POLICY "Users can create their own scans" 
ON ai_scan_results 
FOR INSERT 
WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can update their own scans" 
ON ai_scan_results 
FOR UPDATE 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN auth.uid() = user_id
    ELSE true
  END
);

CREATE POLICY "Users can delete their own scans" 
ON ai_scan_results 
FOR DELETE 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN auth.uid() = user_id
    ELSE true
  END
);