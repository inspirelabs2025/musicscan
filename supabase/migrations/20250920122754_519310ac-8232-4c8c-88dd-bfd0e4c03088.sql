-- Add image_url column to news_blog_posts table
ALTER TABLE public.news_blog_posts 
ADD COLUMN image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.news_blog_posts.image_url IS 'URL of AI-generated image for the blog post';