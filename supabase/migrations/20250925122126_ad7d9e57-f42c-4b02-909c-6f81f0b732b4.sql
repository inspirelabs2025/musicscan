-- Enable RLS to be safe (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies on profiles to avoid restrictive/AND behavior
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END$$;

-- Create a single permissive SELECT policy allowing public profiles or own profile
CREATE POLICY "Public or own profiles are viewable"
ON public.profiles
FOR SELECT
USING (
  (is_public IS TRUE) OR (auth.uid() = user_id)
);