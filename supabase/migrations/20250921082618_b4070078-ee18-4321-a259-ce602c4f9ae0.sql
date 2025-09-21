-- Update subscription plans with actual Stripe product and price IDs
UPDATE public.subscription_plans SET 
  stripe_product_id = 'prod_T5uIaFHsO8ZWod',
  stripe_price_id = 'price_1S9iTdIWa9kBN7qApfEifpP8'
WHERE slug = 'basic';

UPDATE public.subscription_plans SET 
  stripe_product_id = 'prod_T5uJ0WqdCzo7sA',
  stripe_price_id = 'price_1S9iVEIWa9kBN7qAdDwVzFFi'
WHERE slug = 'plus';

UPDATE public.subscription_plans SET 
  stripe_product_id = 'prod_T5uOLxQIOyXLdi',
  stripe_price_id = 'price_1S9iZfIWa9kBN7qAQkMa7aOd'
WHERE slug = 'pro';

UPDATE public.subscription_plans SET 
  stripe_product_id = 'prod_T5uPqO0mrQeWCZ',
  stripe_price_id = 'price_1S9ianIWa9kBN7qARE1xFmi6'
WHERE slug = 'business';