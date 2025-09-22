-- Update existing profiles to be public by default (opt-in social discovery)
UPDATE public.profiles 
SET is_public = true, updated_at = now()
WHERE is_public = false;

-- Update the default value for new profiles to be public
ALTER TABLE public.profiles 
ALTER COLUMN is_public SET DEFAULT true;