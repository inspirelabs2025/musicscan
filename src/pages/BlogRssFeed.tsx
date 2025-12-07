import { useEffect } from 'react';

const SUPABASE_URL = 'https://ssxbpyqnjfiyubsuonar.supabase.co';
const RSS_URL = `${SUPABASE_URL}/functions/v1/generate-content-rss?type=blog_posts&limit=100`;

const BlogRssFeed = () => {
  useEffect(() => {
    // Redirect immediately to the RSS feed
    window.location.replace(RSS_URL);
  }, []);

  return null;
};

export default BlogRssFeed;
