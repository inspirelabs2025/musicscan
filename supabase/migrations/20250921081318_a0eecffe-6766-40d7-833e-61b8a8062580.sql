-- Subscription system database schema

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  stripe_product_id text UNIQUE,
  stripe_price_id text UNIQUE,
  price_amount integer NOT NULL, -- in cents
  currency text NOT NULL DEFAULT 'EUR',
  billing_interval text NOT NULL DEFAULT 'month',
  ai_scans_limit integer, -- NULL means unlimited
  bulk_upload_limit integer DEFAULT 1,
  ai_chat_limit integer, -- NULL means unlimited  
  marketplace_access boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  api_access boolean DEFAULT false,
  white_label boolean DEFAULT false,
  multi_user boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.subscription_plans(id),
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'active', -- active, inactive, canceled, past_due
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, stripe_subscription_id)
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  ai_scans_used integer DEFAULT 0,
  ai_chat_used integer DEFAULT 0,
  bulk_uploads_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Create subscription events table for logging
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  stripe_event_id text UNIQUE,
  data jsonb,
  processed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Subscription plans are viewable by everyone" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (true);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage" 
ON public.usage_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage tracking" 
ON public.usage_tracking 
FOR ALL 
USING (true);

-- RLS Policies for subscription_events  
CREATE POLICY "System can manage subscription events" 
ON public.subscription_events 
FOR ALL 
USING (true);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, price_amount, ai_scans_limit, bulk_upload_limit, ai_chat_limit, marketplace_access, sort_order) VALUES
('FREE - Music Explorer', 'free', 0, 10, 1, 5, false, 1),
('BASIC - Collection Builder', 'basic', 395, 50, 5, 20, false, 2), 
('PLUS - Music Enthusiast', 'plus', 795, 200, 20, NULL, true, 3),
('PRO - Serious Collector', 'pro', 1495, NULL, 50, NULL, true, 4),
('BUSINESS - Trading House', 'business', 2995, NULL, 100, NULL, true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Create function to get current usage for a user
CREATE OR REPLACE FUNCTION public.get_current_usage(p_user_id uuid)
RETURNS TABLE(
  ai_scans_used integer,
  ai_chat_used integer,
  bulk_uploads_used integer,
  period_start date,
  period_end date
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_period_start date;
  current_period_end date;
BEGIN
  -- Calculate current billing period (monthly)
  current_period_start := date_trunc('month', CURRENT_DATE)::date;
  current_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
  
  -- Get or create usage record for current period
  INSERT INTO public.usage_tracking (user_id, period_start, period_end)
  VALUES (p_user_id, current_period_start, current_period_end)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Return current usage
  RETURN QUERY
  SELECT 
    ut.ai_scans_used,
    ut.ai_chat_used, 
    ut.bulk_uploads_used,
    ut.period_start,
    ut.period_end
  FROM public.usage_tracking ut
  WHERE ut.user_id = p_user_id 
    AND ut.period_start = current_period_start;
END;
$$;

-- Create function to increment usage counters
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_usage_type text,
  p_increment integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_period_start date;
  current_period_end date;
BEGIN
  -- Calculate current billing period
  current_period_start := date_trunc('month', CURRENT_DATE)::date;
  current_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
  
  -- Create usage record if it doesn't exist
  INSERT INTO public.usage_tracking (user_id, period_start, period_end)
  VALUES (p_user_id, current_period_start, current_period_end)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Update the appropriate counter
  IF p_usage_type = 'ai_scans' THEN
    UPDATE public.usage_tracking 
    SET ai_scans_used = ai_scans_used + p_increment,
        updated_at = now()
    WHERE user_id = p_user_id AND period_start = current_period_start;
  ELSIF p_usage_type = 'ai_chat' THEN
    UPDATE public.usage_tracking 
    SET ai_chat_used = ai_chat_used + p_increment,
        updated_at = now()
    WHERE user_id = p_user_id AND period_start = current_period_start;
  ELSIF p_usage_type = 'bulk_uploads' THEN
    UPDATE public.usage_tracking 
    SET bulk_uploads_used = bulk_uploads_used + p_increment,
        updated_at = now()
    WHERE user_id = p_user_id AND period_start = current_period_start;
  END IF;
  
  RETURN true;
END;
$$;

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id uuid,
  p_usage_type text
)
RETURNS TABLE(
  can_use boolean,
  current_usage integer,
  limit_amount integer,
  plan_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_plan record;
  current_usage_record record;
  usage_limit integer;
  current_count integer := 0;
BEGIN
  -- Get user's current subscription plan (default to FREE)
  SELECT sp.* INTO user_plan
  FROM public.subscription_plans sp
  LEFT JOIN public.user_subscriptions us ON sp.id = us.plan_id 
  WHERE (us.user_id = p_user_id AND us.status = 'active')
     OR (us.user_id IS NULL AND sp.slug = 'free')
  ORDER BY us.created_at DESC NULLS LAST
  LIMIT 1;
  
  -- If no plan found, default to FREE
  IF user_plan IS NULL THEN
    SELECT * INTO user_plan FROM public.subscription_plans WHERE slug = 'free';
  END IF;
  
  -- Get current usage
  SELECT * INTO current_usage_record FROM public.get_current_usage(p_user_id);
  
  -- Determine usage limit and current count based on type
  IF p_usage_type = 'ai_scans' THEN
    usage_limit := user_plan.ai_scans_limit;
    current_count := COALESCE(current_usage_record.ai_scans_used, 0);
  ELSIF p_usage_type = 'ai_chat' THEN
    usage_limit := user_plan.ai_chat_limit;
    current_count := COALESCE(current_usage_record.ai_chat_used, 0);
  ELSIF p_usage_type = 'bulk_uploads' THEN
    usage_limit := user_plan.bulk_upload_limit;
    current_count := COALESCE(current_usage_record.bulk_uploads_used, 0);
  END IF;
  
  -- Return result
  RETURN QUERY SELECT 
    (usage_limit IS NULL OR current_count < usage_limit) as can_use,
    current_count as current_usage,
    usage_limit as limit_amount,
    user_plan.name as plan_name;
END;
$$;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_subscription_tables()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_subscription_tables();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_subscription_tables();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_subscription_tables();