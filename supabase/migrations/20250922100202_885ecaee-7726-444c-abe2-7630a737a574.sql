-- Fix security issue: Make profiles private by default
-- Change the default value of is_public from true to false
ALTER TABLE public.profiles 
ALTER COLUMN is_public SET DEFAULT false;

-- Update existing profiles to be private by default 
-- (users can manually opt-in to make their profile public)
UPDATE public.profiles 
SET is_public = false 
WHERE is_public = true;

-- Add a comment to document the security fix
COMMENT ON COLUMN public.profiles.is_public IS 'Users must explicitly opt-in to make their profile public for security and privacy';