-- Emergency cleanup: Delete all products and blogs created today
-- Step 1: Delete all blog posts from today
DELETE FROM blog_posts 
WHERE DATE(created_at) = CURRENT_DATE;

-- Step 2: Delete all platform products from today  
DELETE FROM platform_products
WHERE DATE(created_at) = CURRENT_DATE;