-- Create app_secrets table for secure storage of application credentials
CREATE TABLE IF NOT EXISTS public.app_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_key text UNIQUE NOT NULL,
  secret_value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index for fast lookups
CREATE INDEX idx_app_secrets_key ON public.app_secrets(secret_key);

-- Enable RLS
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Policy: Only admins can view secrets
CREATE POLICY "Only admins can view secrets"
  ON public.app_secrets
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Policy: Only admins can manage secrets
CREATE POLICY "Only admins can manage secrets"
  ON public.app_secrets
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));