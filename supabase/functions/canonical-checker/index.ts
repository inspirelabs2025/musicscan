const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanonicalCheckResult {
  url: string;
  finalURL: string;
  status: number;
  contentType?: string;
  contentLength?: number;
  canonical?: string | null;
  canonicalStatus: "OK_SELF" | "MISSING" | "HOMEPAGE_CANONICAL" | "DIFFERENT_PATH" | "DIFFERENT_DOMAIN" | "MULTIPLE_CANONICALS";
  multipleCanonicals?: string[];
  noindex: boolean;
  xRobotsTag?: string | null;
  redirected: boolean;
  redirectLocation?: string | null;
  soft404: boolean;
  wordCount: number;
  thinContent: boolean;
  checkedAt: string;
}

// Helper: Normalize URL
function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);
    // Force www
    if (!urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = 'www.' + urlObj.hostname;
    }
    // Force https
    urlObj.protocol = 'https:';
    // Remove trailing slash
    urlObj.pathname = urlObj.pathname.replace(/\/$/, '') || '/';
    // Remove query params
    urlObj.search = '';
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Helper: Extract canonicals from HTML
function extractCanonicals(html: string): string[] {
  const canonicals: string[] = [];
  const regex = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    canonicals.push(match[1]);
  }
  return canonicals;
}

// Helper: Extract robots meta tag
function extractRobotsTag(html: string): { noindex: boolean; content?: string } {
  const regex = /<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i;
  const match = html.match(regex);
  if (match) {
    const content = match[1].toLowerCase();
    return { noindex: content.includes('noindex'), content: match[1] };
  }
  return { noindex: false };
}

// Helper: Count words
function countWords(html: string): number {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  // Count words
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

// Helper: Compare canonical
function compareCanonical(url: string, canonical: string | undefined, allCanonicals: string[]): string {
  if (!canonical) return 'MISSING';
  if (allCanonicals.length > 1) return 'MULTIPLE_CANONICALS';
  
  const normalized = normalizeURL(url);
  const normalizedCanonical = normalizeURL(canonical);
  
  if (normalizedCanonical === 'https://www.musicscan.app/') {
    return 'HOMEPAGE_CANONICAL';
  }
  
  if (normalizedCanonical === normalized) {
    return 'OK_SELF';
  }
  
  const urlObj = new URL(normalized);
  const canonicalObj = new URL(normalizedCanonical);
  
  if (urlObj.hostname !== canonicalObj.hostname) {
    return 'DIFFERENT_DOMAIN';
  }
  
  if (urlObj.pathname !== canonicalObj.pathname) {
    return 'DIFFERENT_PATH';
  }
  
  return 'OK_SELF';
}

// Main: Check single URL
async function checkURL(url: string): Promise<CanonicalCheckResult> {
  const result: CanonicalCheckResult = {
    url,
    finalURL: url,
    status: 0,
    canonical: null,
    canonicalStatus: 'MISSING',
    noindex: false,
    redirected: false,
    soft404: false,
    wordCount: 0,
    thinContent: false,
    checkedAt: new Date().toISOString(),
  };

  try {
    console.log(`Checking URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    result.status = response.status;
    result.contentType = response.headers.get('content-type') || undefined;
    result.contentLength = parseInt(response.headers.get('content-length') || '0');
    result.xRobotsTag = response.headers.get('x-robots-tag') || undefined;

    // Check for redirect
    if (response.status >= 300 && response.status < 400) {
      result.redirected = true;
      result.redirectLocation = response.headers.get('location') || undefined;
      return result;
    }

    // Only parse HTML for 200 responses
    if (response.status === 200 && result.contentType?.includes('text/html')) {
      const html = await response.text();
      
      // Extract canonicals
      const canonicals = extractCanonicals(html);
      result.canonical = canonicals[0] || null;
      if (canonicals.length > 1) {
        result.multipleCanonicals = canonicals;
      }
      
      // Extract robots tag
      const robots = extractRobotsTag(html);
      result.noindex = robots.noindex;
      
      // Check X-Robots-Tag header
      if (result.xRobotsTag?.toLowerCase().includes('noindex')) {
        result.noindex = true;
      }
      
      // Count words
      result.wordCount = countWords(html);
      result.thinContent = result.wordCount < 150;
      
      // Detect soft-404
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const title = titleMatch?.[1]?.toLowerCase() || '';
      const h1 = h1Match?.[1]?.toLowerCase() || '';
      
      if (result.wordCount < 120 || title.includes('404') || title.includes('not found') || h1.includes('404') || h1.includes('niet gevonden')) {
        result.soft404 = true;
      }
      
      // Compare canonical
      result.canonicalStatus = compareCanonical(url, result.canonical, canonicals);
    }

    result.finalURL = url;

  } catch (error) {
    console.error(`Error checking ${url}:`, error);
    result.status = 0;
  }

  return result;
}

// Main: Check URLs in batches
async function checkURLsBatch(urls: string[], concurrency: number): Promise<CanonicalCheckResult[]> {
  const results: CanonicalCheckResult[] = [];
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(url => checkURL(url)));
    results.push(...batchResults);
    
    console.log(`Checked ${Math.min(i + concurrency, urls.length)} / ${urls.length} URLs`);
  }
  
  return results;
}

// Main: Parse sitemaps
async function parseSitemaps(sitemapUrls: string[]): Promise<string[]> {
  const allUrls = new Set<string>();
  
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl);
      const xml = await response.text();
      
      // Extract <loc> tags
      const locRegex = /<loc>([^<]+)<\/loc>/gi;
      let match;
      while ((match = locRegex.exec(xml)) !== null) {
        allUrls.add(match[1]);
      }
    } catch (error) {
      console.error(`Error parsing sitemap ${sitemapUrl}:`, error);
    }
  }
  
  return Array.from(allUrls);
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || 'parse-sitemaps';
    
    console.log('Received action:', action);
    console.log('Request body:', JSON.stringify(body));

    if (action === 'parse-sitemaps') {
      const { sitemapUrls } = body;
      const urls = await parseSitemaps(sitemapUrls);
      
      return new Response(
        JSON.stringify({ urls, count: urls.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'check-urls') {
      const { urls, concurrency = 8 } = body;
      const results = await checkURLsBatch(urls, concurrency);
      
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'test-single') {
      const { url } = body;
      const result = await checkURL(url);
      
      return new Response(
        JSON.stringify({ result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('Invalid action received:', action);
      return new Response(
        JSON.stringify({ error: 'Invalid action', receivedAction: action }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
