// Sitemap generation utility for MusicScan
export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = (entries: SitemapEntry[]): string => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
  
  return xml;
};

// Static routes for sitemap
export const getStaticRoutes = (): SitemapEntry[] => {
  const baseUrl = 'https://www.musicscan.app';
  const currentDate = new Date().toISOString().split('T')[0];
  
  return [
    {
      url: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/scanner`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/public-catalog`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/public-shops-overview`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/music-news`,
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/plaat-verhaal`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/auth`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    }
  ];
};

// Get blog posts for sitemap
export const getBlogPostRoutes = async (): Promise<SitemapEntry[]> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at, yaml_frontmatter')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts for sitemap:', error);
      return [];
    }

    const baseUrl = 'https://www.musicscan.app';
    
    return blogPosts.map((post) => ({
      url: `${baseUrl}/plaat-verhaal/${post.slug}`,
      lastmod: post.updated_at || post.published_at || new Date().toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: 0.7
    }));
  } catch (error) {
    console.error('Error generating blog post sitemap entries:', error);
    return [];
  }
};

// Get music stories for sitemap
export const getMusicStoryRoutes = async (): Promise<SitemapEntry[]> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    const { data: musicStories, error } = await supabase
      .from('music_stories')
      .select('slug, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching music stories for sitemap:', error);
      return [];
    }

    const baseUrl = 'https://www.musicscan.app';
    
    return musicStories.map((story) => ({
      url: `${baseUrl}/muziek-verhaal/${story.slug}`,
      lastmod: story.updated_at || story.created_at || new Date().toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: 0.7
    }));
  } catch (error) {
    console.error('Error generating music story sitemap entries:', error);
    return [];
  }
};

// Generate robots.txt content
export const generateRobotsTxt = (): string => {
  return `User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Crawl-delay: 2

# Sitemaps
Sitemap: https://www.musicscan.app/sitemap.xml
Sitemap: https://www.musicscan.app/sitemap-blog.xml
Sitemap: https://www.musicscan.app/sitemap-music-stories.xml

# Disallow admin and internal paths
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /private/

# SEO optimizations
Allow: /public-catalog
Allow: /public-shops-overview
Allow: /music-news
Allow: /scanner`;
};

// SEO-friendly URL generation
export const generateSEOFriendlySlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .substring(0, 100); // Limit length
};

// Album/Release URL generator
export const generateAlbumUrl = (id: string, artist: string, album: string): string => {
  const artistSlug = generateSEOFriendlySlug(artist);
  const albumSlug = generateSEOFriendlySlug(album);
  return `/release/${id}/${artistSlug}-${albumSlug}`;
};

// Shop URL generator
export const generateShopUrl = (shopSlug: string): string => {
  return `/shop/${shopSlug}`;
};

// Collection URL generator
export const generateUserCollectionUrl = (username: string): string => {
  const userSlug = generateSEOFriendlySlug(username);
  return `/collection/${userSlug}`;
};

export const generateMusicStoryUrl = (slug: string): string => {
  return `/muziek-verhaal/${slug}`;
};