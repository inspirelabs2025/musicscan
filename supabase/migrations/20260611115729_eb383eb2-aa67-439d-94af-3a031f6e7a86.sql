GRANT SELECT ON public.news_blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_blog_posts TO authenticated;
GRANT ALL ON public.news_blog_posts TO service_role;