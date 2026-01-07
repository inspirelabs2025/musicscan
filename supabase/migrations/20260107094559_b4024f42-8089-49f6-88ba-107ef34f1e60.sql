-- Insert business subscription for rogiervisser76@gmail.com with unlimited access
INSERT INTO public.user_subscriptions (
  user_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  '567d3376-a797-447c-86cb-4c2f1260e997',
  '31403ded-c79b-448f-9d23-96e93c8712e4',
  'active',
  NOW(),
  NOW() + INTERVAL '100 years',
  false
);