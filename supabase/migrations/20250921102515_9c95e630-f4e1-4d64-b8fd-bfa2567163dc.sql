-- Add email notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email_notifications boolean DEFAULT true;

-- Add index for better performance when filtering users who want emails
CREATE INDEX idx_profiles_email_notifications ON public.profiles(email_notifications) WHERE email_notifications = true;