
-- Step 1: Create demo user for existing data
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@vinylscanner.app',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Add user_id columns to all relevant tables
ALTER TABLE ai_scan_results ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vinyl2_scan ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE cd_scan ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vinyl_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE chat_messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE batch_uploads ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE discogs_pricing_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Assign all existing records to demo user
UPDATE ai_scan_results SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE vinyl2_scan SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE cd_scan SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE vinyl_records SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE chat_messages SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE batch_uploads SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE discogs_pricing_sessions SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;

-- Step 4: Make user_id NOT NULL for future records
ALTER TABLE ai_scan_results ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE vinyl2_scan ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE cd_scan ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE vinyl_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE batch_uploads ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE discogs_pricing_sessions ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Drop existing anonymous policies
DROP POLICY IF EXISTS "Allow anonymous read access" ON ai_scan_results;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON ai_scan_results;
DROP POLICY IF EXISTS "Allow anonymous update access" ON ai_scan_results;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON ai_scan_results;

DROP POLICY IF EXISTS "Allow anonymous read access" ON vinyl2_scan;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON vinyl2_scan;
DROP POLICY IF EXISTS "Allow anonymous update access" ON vinyl2_scan;

DROP POLICY IF EXISTS "Allow anonymous read access" ON cd_scan;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON cd_scan;
DROP POLICY IF EXISTS "Allow anonymous update access" ON cd_scan;

DROP POLICY IF EXISTS "Allow anonymous read access" ON vinyl_records;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON vinyl_records;
DROP POLICY IF EXISTS "Allow anonymous update access" ON vinyl_records;

DROP POLICY IF EXISTS "Allow anonymous read access" ON chat_messages;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON chat_messages;
DROP POLICY IF EXISTS "Allow anonymous update access" ON chat_messages;

DROP POLICY IF EXISTS "Allow anonymous read access" ON batch_uploads;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON batch_uploads;
DROP POLICY IF EXISTS "Allow anonymous update access" ON batch_uploads;

DROP POLICY IF EXISTS "Allow anonymous read access" ON discogs_pricing_sessions;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON discogs_pricing_sessions;
DROP POLICY IF EXISTS "Allow anonymous update access" ON discogs_pricing_sessions;

-- Step 6: Create user-specific RLS policies for ai_scan_results
CREATE POLICY "Users can view their own scans" ON ai_scan_results
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" ON ai_scan_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" ON ai_scan_results
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans" ON ai_scan_results
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 7: Create user-specific RLS policies for vinyl2_scan
CREATE POLICY "Users can view their own vinyl scans" ON vinyl2_scan
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vinyl scans" ON vinyl2_scan
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vinyl scans" ON vinyl2_scan
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vinyl scans" ON vinyl2_scan
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 8: Create user-specific RLS policies for cd_scan
CREATE POLICY "Users can view their own cd scans" ON cd_scan
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cd scans" ON cd_scan
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cd scans" ON cd_scan
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cd scans" ON cd_scan
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 9: Create user-specific RLS policies for vinyl_records
CREATE POLICY "Users can view their own vinyl records" ON vinyl_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vinyl records" ON vinyl_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vinyl records" ON vinyl_records
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vinyl records" ON vinyl_records
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 10: Create user-specific RLS policies for chat_messages
CREATE POLICY "Users can view their own chat messages" ON chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 11: Create user-specific RLS policies for batch_uploads
CREATE POLICY "Users can view their own batch uploads" ON batch_uploads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch uploads" ON batch_uploads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch uploads" ON batch_uploads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch uploads" ON batch_uploads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 12: Create user-specific RLS policies for discogs_pricing_sessions
CREATE POLICY "Users can view their own pricing sessions" ON discogs_pricing_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pricing sessions" ON discogs_pricing_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pricing sessions" ON discogs_pricing_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pricing sessions" ON discogs_pricing_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 13: Create indexes for better performance
CREATE INDEX idx_ai_scan_results_user_id ON ai_scan_results(user_id);
CREATE INDEX idx_vinyl2_scan_user_id ON vinyl2_scan(user_id);
CREATE INDEX idx_cd_scan_user_id ON cd_scan(user_id);
CREATE INDEX idx_vinyl_records_user_id ON vinyl_records(user_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_batch_uploads_user_id ON batch_uploads(user_id);
CREATE INDEX idx_discogs_pricing_sessions_user_id ON discogs_pricing_sessions(user_id);
