
-- Function to notify admin of new user signups
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  new_user_name text;
BEGIN
  -- Find all admin users
  FOR admin_user_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Get the new user's name
    new_user_name := COALESCE(NEW.first_name, 'Nieuwe gebruiker');
    
    INSERT INTO public.notifications (user_id, type, message, link, icon, is_read)
    VALUES (
      admin_user_id,
      'new_user_signup',
      '🎉 Nieuwe gebruiker aangemeld: ' || new_user_name,
      '/admin/users',
      'UserPlus',
      false
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (profiles are auto-created on signup)
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON public.profiles;
CREATE TRIGGER trigger_notify_admin_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();
