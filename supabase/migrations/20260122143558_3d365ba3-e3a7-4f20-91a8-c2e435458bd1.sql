
-- Create unlimited subscription for michaelflesburg@gmail.com (user_id: ee0fa75e-11f6-42ef-ae08-09ea3e1a2989)
INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  'ee0fa75e-11f6-42ef-ae08-09ea3e1a2989',
  '31403ded-c79b-448f-9d23-96e93c8712e4',
  'active',
  NOW(),
  NOW() + INTERVAL '100 years',
  false,
  NOW(),
  NOW()
);
