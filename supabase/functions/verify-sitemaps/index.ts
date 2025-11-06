import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting sitemap verification...');
    
    const PUBLIC_BASE = 'https://musicscan.app/sitemaps';
    const STORAGE_BASE = 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps';
    
    // Helper to fetch and count URLs
    const countUrls = async (url: string): Promise<number> => {
      const response = await fetch(url + '?t=' + Date.now());
      const text = await response.text();
      const matches = text.match(/<url>/g);
      return matches ? matches.length : 0;
    };
    
    // Helper to fetch and hash
    const fetchAndHash = async (url: string): Promise<string> => {
      const response = await fetch(url + '?t=' + Date.now());
      const text = await response.text();
      const hash = createHash("md5");
      hash.update(text);
      return hash.toString();
    };
    
    // Count sitemap entries in index
    const indexResponse = await fetch('https://musicscan.app/sitemap.xml?t=' + Date.now());
    const indexText = await indexResponse.text();
    const sitemapCount = (indexText.match(/<sitemap>/g) || []).length;
    
    // Count URLs in each sitemap
    console.log('📊 Counting URLs in sitemaps...');
    const [blogCount, storiesCount, productsCount, staticCount] = await Promise.all([
      countUrls(`${PUBLIC_BASE}/sitemap-blog.xml`),
      countUrls(`${PUBLIC_BASE}/sitemap-music-stories.xml`),
      countUrls(`${PUBLIC_BASE}/sitemap-products.xml`),
      countUrls(`${PUBLIC_BASE}/sitemap-static.xml`)
    ]);
    
    console.log('🔐 Comparing MD5 hashes...');
    // Compare MD5 hashes
    const [
      blogPublicHash, blogStorageHash,
      productsPublicHash, productsStorageHash,
      storiesPublicHash, storiesStorageHash,
      staticPublicHash, staticStorageHash
    ] = await Promise.all([
      fetchAndHash(`${PUBLIC_BASE}/sitemap-blog.xml`),
      fetchAndHash(`${STORAGE_BASE}/sitemap-blog.xml`),
      fetchAndHash(`${PUBLIC_BASE}/sitemap-products.xml`),
      fetchAndHash(`${STORAGE_BASE}/sitemap-products.xml`),
      fetchAndHash(`${PUBLIC_BASE}/sitemap-music-stories.xml`),
      fetchAndHash(`${STORAGE_BASE}/sitemap-music-stories.xml`),
      fetchAndHash(`${PUBLIC_BASE}/sitemap-static.xml`),
      fetchAndHash(`${STORAGE_BASE}/sitemap-static.xml`)
    ]);
    
    const results = {
      counts: {
        index: { actual: sitemapCount, expected: 7, pass: sitemapCount === 7 },
        blog: { actual: blogCount, expected: 1949, pass: blogCount >= 1949 * 0.95 },
        stories: { actual: storiesCount, expected: 17, pass: storiesCount === 17 },
        products: { actual: productsCount, expected: 740, pass: productsCount >= 740 * 0.95 },
        static: { actual: staticCount, expected: '15-20', pass: staticCount >= 15 && staticCount <= 20 }
      },
      hashes: {
        blog: { 
          public: blogPublicHash, 
          storage: blogStorageHash, 
          match: blogPublicHash === blogStorageHash 
        },
        products: { 
          public: productsPublicHash, 
          storage: productsStorageHash, 
          match: productsPublicHash === productsStorageHash 
        },
        stories: { 
          public: storiesPublicHash, 
          storage: storiesStorageHash, 
          match: storiesPublicHash === storiesStorageHash 
        },
        static: { 
          public: staticPublicHash, 
          storage: staticStorageHash, 
          match: staticPublicHash === staticStorageHash 
        }
      },
      allPassed: 
        sitemapCount === 7 &&
        blogCount >= 1949 * 0.95 &&
        storiesCount === 17 &&
        productsCount >= 740 * 0.95 &&
        staticCount >= 15 && staticCount <= 20 &&
        blogPublicHash === blogStorageHash &&
        productsPublicHash === productsStorageHash &&
        storiesPublicHash === storiesStorageHash &&
        staticPublicHash === staticStorageHash
    };
    
    console.log('✅ Verification complete:', results);
    
    return new Response(
      JSON.stringify(results, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
