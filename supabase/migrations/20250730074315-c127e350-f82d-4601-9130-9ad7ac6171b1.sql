-- Update RLS policies for cd_scan and vinyl2_scan to match ai_scan_results pattern
-- This allows all records to be visible when not authenticated, but filters by user when authenticated

-- Drop existing policies for cd_scan
DROP POLICY IF EXISTS "Users can view own cd scans" ON cd_scan;
DROP POLICY IF EXISTS "Users can create cd scans" ON cd_scan;
DROP POLICY IF EXISTS "Users can update own cd scans" ON cd_scan;
DROP POLICY IF EXISTS "Users can delete own cd scans" ON cd_scan;

-- Create new policies for cd_scan with fallback logic
CREATE POLICY "Users can view cd scans" ON cd_scan FOR SELECT USING (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);

CREATE POLICY "Users can create cd scans" ON cd_scan FOR INSERT WITH CHECK (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);

CREATE POLICY "Users can update cd scans" ON cd_scan FOR UPDATE USING (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);

CREATE POLICY "Users can delete cd scans" ON cd_scan FOR DELETE USING (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);

-- Drop existing policies for vinyl2_scan
DROP POLICY IF EXISTS "Users can view own vinyl scans" ON vinyl2_scan;
DROP POLICY IF EXISTS "Users can create vinyl scans" ON vinyl2_scan;
DROP POLICY IF EXISTS "Users can update own vinyl scans" ON vinyl2_scan;
DROP POLICY IF EXISTS "Users can delete own vinyl scans" ON vinyl2_scan;

-- Create new policies for vinyl2_scan with fallback logic
CREATE POLICY "Users can view vinyl scans" ON vinyl2_scan FOR SELECT USING (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);

CREATE POLICY "Users can create vinyl scans" ON vinyl2_scan FOR INSERT WITH CHECK (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);

CREATE POLICY "Users can update vinyl scans" ON vinyl2_scan FOR UPDATE USING (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);

CREATE POLICY "Users can delete vinyl scans" ON vinyl2_scan FOR DELETE USING (
  CASE 
    WHEN (auth.uid() IS NOT NULL) THEN (auth.uid() = user_id) 
    ELSE true 
  END
);