
-- Trigger function to send email on new admin alert
CREATE OR REPLACE FUNCTION public.notify_admin_alert_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the send-admin-alert-email edge function via pg_net
  PERFORM net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/send-admin-alert-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4'
    ),
    body := jsonb_build_object(
      'alert_type', NEW.alert_type,
      'message', NEW.message,
      'source_function', NEW.source_function,
      'metadata', NEW.metadata
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on admin_alerts table
CREATE TRIGGER on_admin_alert_send_email
  AFTER INSERT ON public.admin_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_alert_email();
