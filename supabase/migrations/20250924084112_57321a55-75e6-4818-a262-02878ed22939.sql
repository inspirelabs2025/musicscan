-- Ensure blog posts are publicly readable for everyone
DROP POLICY IF EXISTS "Blog posts are viewable by everyone" ON public.blog_posts;  
CREATE POLICY "Blog posts are viewable by everyone" 
ON public.blog_posts 
FOR SELECT 
USING (true);

-- Ensure news blog posts are publicly readable
DROP POLICY IF EXISTS "News blog posts are viewable by everyone" ON public.news_blog_posts;
CREATE POLICY "News blog posts are viewable by everyone" 
ON public.news_blog_posts 
FOR SELECT 
USING (true);