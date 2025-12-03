-- Disable the auto_post_blog_to_facebook trigger to prevent duplicate Facebook posts
-- The create-art-product edge function already handles Facebook posting
DROP TRIGGER IF EXISTS trigger_auto_post_blog_to_facebook ON blog_posts;