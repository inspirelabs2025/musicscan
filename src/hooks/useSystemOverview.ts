import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DatabaseStats {
  table: string;
  count: number;
  label: string;
  icon: string;
  route?: string;
  category: string;
}

export interface EdgeFunctionInfo {
  name: string;
  category: string;
  description?: string;
}

export interface RouteInfo {
  path: string;
  title: string;
  description?: string;
  category: string;
}

// All edge functions categorized
export const EDGE_FUNCTIONS: EdgeFunctionInfo[] = [
  // Content Generators
  { name: 'plaat-verhaal-generator', category: 'Content', description: 'Genereert album verhalen/blogs' },
  { name: 'generate-artist-story', category: 'Content', description: 'Genereert artist stories' },
  { name: 'music-story-generator', category: 'Content', description: 'Muziek verhalen generator' },
  { name: 'daily-anecdote-generator', category: 'Content', description: 'Dagelijkse anekdotes' },
  { name: 'generate-daily-music-history', category: 'Content', description: 'Muziekgeschiedenis artikelen' },
  { name: 'rss-news-rewriter', category: 'Content', description: 'Herschrijft RSS nieuws' },
  { name: 'daily-artist-stories-generator', category: 'Content', description: 'Dagelijkse artist stories' },
  { name: 'artist-stories-batch-processor', category: 'Content', description: 'Batch artist stories' },
  { name: 'batch-blog-processor', category: 'Content', description: 'Batch blog generatie' },
  { name: 'latest-discogs-news', category: 'Content', description: 'Discogs nieuws generator' },
  { name: 'music-news-enhanced', category: 'Content', description: 'Enhanced muzieknieuws' },
  
  // Data Import
  { name: 'discogs-lp-crawler', category: 'Import', description: 'Crawlt Discogs LP releases' },
  { name: 'import-singles-batch', category: 'Import', description: 'Importeert singles batch' },
  { name: 'singles-batch-processor', category: 'Import', description: 'Verwerkt singles' },
  { name: 'process-discogs-queue', category: 'Import', description: 'Verwerkt Discogs queue' },
  { name: 'generate-curated-artists', category: 'Import', description: 'Genereert curated artists' },
  { name: 'discogs-search', category: 'Import', description: 'Zoekt in Discogs' },
  
  // SEO
  { name: 'indexnow-submit', category: 'SEO', description: 'Submits URLs naar IndexNow' },
  { name: 'indexnow-processor', category: 'SEO', description: 'Verwerkt IndexNow queue' },
  { name: 'indexnow-cron', category: 'SEO', description: 'IndexNow cron job' },
  { name: 'sitemap-queue-processor', category: 'SEO', description: 'Regenereert sitemaps' },
  { name: 'generate-static-sitemaps', category: 'SEO', description: 'Statische sitemaps' },
  { name: 'generate-llm-sitemap', category: 'SEO', description: 'LLM-optimized sitemap' },
  { name: 'auto-generate-keywords', category: 'SEO', description: 'Genereert SEO keywords' },
  
  // Art Generation
  { name: 'generate-album-art', category: 'Art', description: 'Album artwork generator' },
  { name: 'bulk-poster-processor', category: 'Art', description: 'Bulk poster generatie' },
  { name: 'generate-sock-design', category: 'Art', description: 'Sokken design generator' },
  { name: 'generate-tshirt-design', category: 'Art', description: 'T-shirt design generator' },
  { name: 'generate-button-design', category: 'Art', description: 'Button design generator' },
  { name: 'generate-lyric-poster', category: 'Art', description: 'Lyric poster generator' },
  { name: 'sketch-art-generator', category: 'Art', description: 'Sketch art generator' },
  
  // Shop & Payments
  { name: 'create-shop-payment', category: 'Shop', description: 'Shop betalingen' },
  { name: 'create-checkout', category: 'Shop', description: 'Checkout sessie' },
  { name: 'stripe-webhook', category: 'Shop', description: 'Stripe webhook handler' },
  { name: 'mollie-webhook', category: 'Shop', description: 'Mollie webhook handler' },
  { name: 'create-poster-product', category: 'Shop', description: 'Maakt poster producten' },
  
  // Community
  { name: 'refresh-featured-photos', category: 'Community', description: 'Ververst uitgelichte fotos' },
  { name: 'generate-ai-comment', category: 'Community', description: 'AI gegenereerde comments' },
  { name: 'weekly-forum-discussions', category: 'Community', description: 'Wekelijkse forum discussies' },
  
  // Email
  { name: 'send-email', category: 'Email', description: 'Verstuurt emails' },
  { name: 'daily-email-digest', category: 'Email', description: 'Dagelijkse email digest' },
  { name: 'send-weekly-discussion-notification', category: 'Email', description: 'Wekelijkse notificaties' },
  
  // AI & Chat
  { name: 'echo-chat', category: 'AI', description: 'Echo AI chat' },
  { name: 'collection-chat', category: 'AI', description: 'Collectie chat assistent' },
  { name: 'generate-album-insights', category: 'AI', description: 'Album inzichten generator' },
  
  // Utilities
  { name: 'test-discogs', category: 'Utility', description: 'Test Discogs connectie' },
  { name: 'test-catalog-search', category: 'Utility', description: 'Test catalog zoeken' },
  { name: 'get-discogs-price', category: 'Utility', description: 'Haalt Discogs prijzen op' },
  { name: 'facebook-catalog-sync', category: 'Utility', description: 'Facebook catalog sync' },
];

// Public routes
export const PUBLIC_ROUTES: RouteInfo[] = [
  { path: '/', title: 'Homepage', category: 'Main' },
  { path: '/verhalen', title: 'Verhalen', description: 'Album blog overzicht', category: 'Content' },
  { path: '/nieuws', title: 'Nieuws', description: 'Muzieknieuws', category: 'Content' },
  { path: '/artists', title: 'Artiesten', description: 'Artiesten overzicht', category: 'Content' },
  { path: '/artist-spotlights', title: 'Artist Spotlights', category: 'Content' },
  { path: '/reviews', title: 'Reviews', description: 'Album reviews', category: 'Content' },
  { path: '/releases', title: 'Releases', description: 'Nieuwe releases', category: 'Content' },
  { path: '/vandaag-in-de-muziekgeschiedenis', title: 'Muziekgeschiedenis', category: 'Content' },
  { path: '/fanwall', title: 'FanWall', description: 'Fan fotos', category: 'Community' },
  { path: '/forum', title: 'Forum', description: 'Community forum', category: 'Community' },
  { path: '/community', title: 'Community', category: 'Community' },
  { path: '/echo', title: 'Magic Mike', description: 'Muziekdetective chat', category: 'Features' },
  { path: '/sokken', title: 'Sokken Shop', category: 'Shop' },
  { path: '/shirts', title: 'T-Shirts Shop', category: 'Shop' },
  { path: '/posters', title: 'Poster Shop', category: 'Shop' },
  { path: '/canvas', title: 'Canvas Shop', category: 'Shop' },
  { path: '/art', title: 'Art Shop', category: 'Shop' },
  { path: '/marketplace', title: 'Marketplace', category: 'Shop' },
  { path: '/shops', title: 'Shops Overzicht', category: 'Shop' },
  { path: '/scan', title: 'Scanner', description: 'Album scanner', category: 'Features' },
  { path: '/pricing', title: 'Prijzen', category: 'Main' },
  { path: '/about', title: 'Over Ons', category: 'Main' },
];

// Admin routes
export const ADMIN_ROUTES: RouteInfo[] = [
  // Dashboard
  { path: '/admin', title: 'Admin Overview', category: 'Dashboard' },
  { path: '/admin/dashboard', title: 'SuperAdmin Stats', category: 'Dashboard' },
  { path: '/admin/cronjob-monitor', title: 'Cronjob Monitor', category: 'Dashboard' },
  { path: '/admin/system-overview', title: 'System Overview', category: 'Dashboard' },
  { path: '/admin/email-notifications', title: 'Email & Notifications', category: 'Dashboard' },
  
  // User Management
  { path: '/admin/users', title: 'User Management', category: 'Users' },
  
  // Products & Shop
  { path: '/admin/products', title: 'All Products', category: 'Shop' },
  { path: '/admin/platform-products', title: 'Platform Products', category: 'Shop' },
  { path: '/admin/shop-products', title: 'Shop Products', category: 'Shop' },
  { path: '/admin/shop-orders', title: 'Shop Orders', category: 'Shop' },
  { path: '/admin/time-machine', title: 'Time Machine', category: 'Shop' },
  
  // Content Generators
  { path: '/admin/art-generator', title: 'Art Generator', category: 'Generators' },
  { path: '/admin/bulk-art-generator', title: 'Bulk Art Generator', category: 'Generators' },
  { path: '/admin/sketch-art-generator', title: 'Sketch Art', category: 'Generators' },
  { path: '/admin/lyric-poster-generator', title: 'Lyric Posters', category: 'Generators' },
  { path: '/admin/sock-generator', title: 'Socks Designer', category: 'Generators' },
  { path: '/admin/tshirt-generator', title: 'T-Shirt Designer', category: 'Generators' },
  { path: '/admin/button-generator', title: 'Button Designer', category: 'Generators' },
  { path: '/admin/photo-stylizer', title: 'Photo Stylizer', category: 'Generators' },
  { path: '/admin/singles-importer', title: 'Singles Importer', category: 'Generators' },
  { path: '/admin/artist-stories-generator', title: 'Artist Stories', category: 'Generators' },
  { path: '/admin/artist-spotlights', title: 'Artist Spotlights', category: 'Generators' },
  
  // Content Management
  { path: '/admin/album-reviews', title: 'Verhalen', category: 'Content' },
  { path: '/admin/news-rss-manager', title: 'RSS News Manager', category: 'Content' },
  { path: '/admin/curated-artists', title: 'Curated Artists', category: 'Content' },
  { path: '/admin/discogs-lookup', title: 'Discogs Lookup', category: 'Content' },
  { path: '/admin/photo-moderation', title: 'Photo Moderation', category: 'Content' },
  { path: '/admin/auto-comments', title: 'Auto Comments', category: 'Content' },
  
  // SEO & Analytics
  { path: '/admin/seo-monitoring', title: 'SEO Monitoring', category: 'SEO' },
  { path: '/admin/sitemap-management', title: 'Sitemap Management', category: 'SEO' },
  { path: '/admin/price-history', title: 'Price History', category: 'SEO' },
  
  // Maintenance
  { path: '/admin/fix-blog-slugs', title: 'Fix Blog Slugs', category: 'Maintenance' },
  { path: '/admin/fix-product-titles', title: 'Fix Product Titles', category: 'Maintenance' },
  { path: '/admin/bulk-cleanup', title: 'Bulk Cleanup', category: 'Maintenance' },
  { path: '/admin/auto-cleanup-today', title: 'Auto Cleanup Today', category: 'Maintenance' },
  { path: '/admin/backfill-artist-fanwalls', title: 'Backfill FanWalls', category: 'Maintenance' },
  { path: '/admin/create-artist-fanwall', title: 'Create FanWall', category: 'Maintenance' },
  { path: '/admin/generate-seed', title: 'Generate Seed', category: 'Maintenance' },
  { path: '/admin/bulk-poster-upload', title: 'Bulk Poster Upload', category: 'Maintenance' },
  
  // Integrations
  { path: '/admin/facebook-sync', title: 'Facebook Sync', category: 'Integrations' },
  
  // Testing
  { path: '/admin/test/music-news', title: 'Test Music News', category: 'Testing' },
  { path: '/admin/test/news-update', title: 'Test News Update', category: 'Testing' },
  { path: '/admin/test/blog-regeneration', title: 'Test Blog Regeneration', category: 'Testing' },
  { path: '/admin/test/discogs-flow', title: 'Test Discogs Flow', category: 'Testing' },
  { path: '/admin/test/discogs-blog-generation', title: 'Test Discogs Blog Gen', category: 'Testing' },
  { path: '/admin/test/discogs-id', title: 'Test Discogs ID Finder', category: 'Testing' },
  { path: '/admin/test/album-cover-backfill', title: 'Test Album Cover Backfill', category: 'Testing' },
  { path: '/admin/test/anecdote-generation', title: 'Test Anekdote Generatie', category: 'Testing' },
];

export const useSystemOverview = () => {
  // Fetch database table counts
  const { data: databaseStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['system-overview-stats'],
    queryFn: async () => {
      const tables = [
        { table: 'blog_posts', label: 'Blog Posts', icon: '📝', route: '/admin/album-reviews', category: 'Content' },
        { table: 'news_blog_posts', label: 'Nieuws Artikelen', icon: '📰', route: '/admin/news-rss-manager', category: 'Content' },
        { table: 'artist_stories', label: 'Artist Stories', icon: '🎤', route: '/admin/artist-stories-generator', category: 'Content' },
        { table: 'music_stories', label: 'Music Stories', icon: '🎵', category: 'Content' },
        { table: 'music_anecdotes', label: 'Anekdotes', icon: '💡', category: 'Content' },
        { table: 'music_history_events', label: 'Muziekgeschiedenis', icon: '📅', category: 'Content' },
        { table: 'profiles', label: 'Gebruikers', icon: '👤', route: '/admin/users', category: 'Community' },
        { table: 'photos', label: 'Fan Fotos', icon: '📸', route: '/admin/photo-moderation', category: 'Community' },
        { table: 'artist_fanwalls', label: 'Artist FanWalls', icon: '🖼️', route: '/admin/backfill-artist-fanwalls', category: 'Community' },
        { table: 'forum_topics', label: 'Forum Topics', icon: '💬', category: 'Community' },
        { table: 'cd_scan', label: 'CD Scans', icon: '💿', category: 'Scans' },
        { table: 'vinyl2_scan', label: 'Vinyl Scans', icon: '📀', category: 'Scans' },
        { table: 'releases', label: 'Releases', icon: '🎹', category: 'Scans' },
        { table: 'curated_artists', label: 'Curated Artists', icon: '⭐', route: '/admin/curated-artists', category: 'Import' },
        { table: 'discogs_import_log', label: 'Discogs Import Log', icon: '📥', category: 'Import' },
      ];

      const results: DatabaseStats[] = [];

      // Fetch regular table counts
      for (const t of tables) {
        try {
          const { count, error } = await supabase
            .from(t.table as any)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            results.push({
              ...t,
              count: count || 0,
            });
          }
        } catch (e) {
          results.push({ ...t, count: 0 });
        }
      }

      // Fetch Shop product counts with specific categories
      try {
        // Total platform products
        const { count: totalProducts } = await supabase
          .from('platform_products')
          .select('*', { count: 'exact', head: true });
        
        results.push({
          table: 'platform_products',
          label: 'Totaal Products',
          icon: '🛍️',
          route: '/admin/platform-products',
          category: 'Shop',
          count: totalProducts || 0,
        });

        // Album Cover Metaalprints
        const { count: metalPrints } = await supabase
          .from('platform_products')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%metaalprint%,title.ilike.%metal print%,slug.ilike.%metaalprint%');
        
        results.push({
          table: 'platform_products_metal',
          label: 'Album Cover Metaalprint',
          icon: '🖼️',
          route: '/admin/platform-products',
          category: 'Shop',
          count: metalPrints || 0,
        });

        // Posters (excluding metal)
        const { count: posters } = await supabase
          .from('platform_products')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%poster%,slug.ilike.%poster%')
          .not('title', 'ilike', '%metaalprint%');
        
        results.push({
          table: 'platform_products_poster',
          label: 'Posters (Papier)',
          icon: '📄',
          route: '/admin/platform-products',
          category: 'Shop',
          count: posters || 0,
        });

        // Canvas
        const { count: canvas } = await supabase
          .from('platform_products')
          .select('*', { count: 'exact', head: true })
          .or('title.ilike.%canvas%,slug.ilike.%canvas%');
        
        results.push({
          table: 'platform_products_canvas',
          label: 'Canvas Prints',
          icon: '🎨',
          route: '/admin/platform-products',
          category: 'Shop',
          count: canvas || 0,
        });

        // Sokken from album_socks
        const { count: socks } = await supabase
          .from('album_socks')
          .select('*', { count: 'exact', head: true });
        
        results.push({
          table: 'album_socks',
          label: 'Sokken Designs',
          icon: '🧦',
          route: '/admin/sock-generator',
          category: 'Shop',
          count: socks || 0,
        });

        // T-shirts from album_tshirts
        const { count: tshirts } = await supabase
          .from('album_tshirts')
          .select('*', { count: 'exact', head: true });
        
        results.push({
          table: 'album_tshirts',
          label: 'T-Shirt Designs',
          icon: '👕',
          route: '/admin/tshirt-generator',
          category: 'Shop',
          count: tshirts || 0,
        });

        // Lyric Posters
        const { count: lyricPosters } = await supabase
          .from('lyric_posters')
          .select('*', { count: 'exact', head: true });
        
        results.push({
          table: 'lyric_posters',
          label: 'Lyric Posters',
          icon: '🎼',
          route: '/admin/lyric-poster-generator',
          category: 'Shop',
          count: lyricPosters || 0,
        });

      } catch (e) {
        console.error('Error fetching shop stats:', e);
      }

      return results;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch cronjob execution summary
  const { data: cronjobSummary, isLoading: cronjobLoading } = useQuery({
    queryKey: ['system-overview-cronjobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronjob_execution_log')
        .select('function_name, status, started_at')
        .order('started_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;

      // Group by function and get latest status
      const byFunction: Record<string, { lastRun: string; lastStatus: string; totalRuns: number; successRate: number }> = {};
      
      data.forEach(item => {
        if (!byFunction[item.function_name]) {
          byFunction[item.function_name] = {
            lastRun: item.started_at,
            lastStatus: item.status,
            totalRuns: 0,
            successRate: 0,
          };
        }
        byFunction[item.function_name].totalRuns++;
      });

      // Calculate success rates
      Object.keys(byFunction).forEach(fn => {
        const fnData = data.filter(d => d.function_name === fn);
        const successCount = fnData.filter(d => d.status === 'success').length;
        byFunction[fn].successRate = fnData.length > 0 ? Math.round((successCount / fnData.length) * 100) : 0;
      });

      return byFunction;
    },
    refetchInterval: 30000,
  });

  // Group edge functions by category
  const edgeFunctionsByCategory = EDGE_FUNCTIONS.reduce((acc, fn) => {
    if (!acc[fn.category]) acc[fn.category] = [];
    acc[fn.category].push(fn);
    return acc;
  }, {} as Record<string, EdgeFunctionInfo[]>);

  // Group routes by category
  const publicRoutesByCategory = PUBLIC_ROUTES.reduce((acc, route) => {
    if (!acc[route.category]) acc[route.category] = [];
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, RouteInfo[]>);

  const adminRoutesByCategory = ADMIN_ROUTES.reduce((acc, route) => {
    if (!acc[route.category]) acc[route.category] = [];
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, RouteInfo[]>);

  // Group database stats by category
  const statsByCategory = (databaseStats || []).reduce((acc, stat) => {
    if (!acc[stat.category]) acc[stat.category] = [];
    acc[stat.category].push(stat);
    return acc;
  }, {} as Record<string, DatabaseStats[]>);

  return {
    databaseStats,
    statsByCategory,
    statsLoading,
    refetchStats,
    cronjobSummary,
    cronjobLoading,
    edgeFunctionsByCategory,
    publicRoutesByCategory,
    adminRoutesByCategory,
    totalEdgeFunctions: EDGE_FUNCTIONS.length,
    totalPublicRoutes: PUBLIC_ROUTES.length,
    totalAdminRoutes: ADMIN_ROUTES.length,
  };
};
