-- Create function to send order confirmation email
CREATE OR REPLACE FUNCTION public.auto_send_order_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger for new orders with valid email
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/send-order-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'order_id', NEW.id,
          'email_type', 'confirmation'
        )
      );
      
      RAISE NOTICE 'Order confirmation email triggered for order: %', NEW.order_number;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to trigger order email for %: %', NEW.order_number, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_order_confirmation_email ON platform_orders;
CREATE TRIGGER trigger_order_confirmation_email
  AFTER INSERT ON platform_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_send_order_confirmation();

-- Create function to send shipped email when tracking is added
CREATE OR REPLACE FUNCTION public.auto_send_order_shipped()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Trigger when status changes to 'shipped' or tracking_number is added
  IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'shipped') OR
     (OLD.tracking_number IS NULL AND NEW.tracking_number IS NOT NULL) THEN
    
    IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
      BEGIN
        PERFORM net.http_post(
          url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/send-order-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'order_id', NEW.id,
            'email_type', 'shipped'
          )
        );
        
        RAISE NOTICE 'Order shipped email triggered for order: %', NEW.order_number;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to trigger shipped email for %: %', NEW.order_number, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for shipped orders
DROP TRIGGER IF EXISTS trigger_order_shipped_email ON platform_orders;
CREATE TRIGGER trigger_order_shipped_email
  AFTER UPDATE ON platform_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_send_order_shipped();

-- Create function to send delivered email
CREATE OR REPLACE FUNCTION public.auto_send_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Trigger when status changes to 'delivered'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered' THEN
    
    IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
      BEGIN
        PERFORM net.http_post(
          url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/send-order-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'order_id', NEW.id,
            'email_type', 'delivered'
          )
        );
        
        RAISE NOTICE 'Order delivered email triggered for order: %', NEW.order_number;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to trigger delivered email for %: %', NEW.order_number, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for delivered orders
DROP TRIGGER IF EXISTS trigger_order_delivered_email ON platform_orders;
CREATE TRIGGER trigger_order_delivered_email
  AFTER UPDATE ON platform_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_send_order_delivered();