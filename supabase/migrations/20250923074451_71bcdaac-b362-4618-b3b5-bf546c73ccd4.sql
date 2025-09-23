-- Add index for better blog_posts query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at_desc ON blog_posts (created_at DESC);

-- Add index for published blogs with user filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_published ON blog_posts (user_id, is_published, created_at DESC);

-- Add index for better slug lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);