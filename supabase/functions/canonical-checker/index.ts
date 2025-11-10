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
  // SPA-aware fields
  variantUsed?: string;
  spaDetected?: boolean;
  canonicalInferred?: boolean;
  inferredReason?: string;
}

// Helper: Normalize URL for comparison (strips www, normalizes protocol/slash)
function normalizeForCompare(url: string): string {
  try {
    const urlObj = new URL(url);
    // Force https
    urlObj.protocol = 'https:';
    // Strip www from hostname for comparison
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.substring(4);
    }
    // Remove trailing slash except for root
    if (urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
    }
    // Remove query params and hash
    urlObj.search = '';
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Helper: Normalize URL (legacy, keeps www)
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

// Helper: Compare canonical (using www-normalized comparison)
function compareCanonical(url: string, canonical: string | undefined, allCanonicals: string[]): string {
  if (!canonical) return 'MISSING';
  if (allCanonicals.length > 1) return 'MULTIPLE_CANONICALS';
  
  const normalized = normalizeForCompare(url);
  const normalizedCanonical = normalizeForCompare(canonical);
  
  // Check if canonical points to homepage (with or without www)
  if (normalizedCanonical === 'https://musicscan.app/' || normalizedCanonical === 'https://musicscan.app') {
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

// Helper: Try to fetch a single URL with browser headers
async function tryFetchOnce(url: string): Promise<{ response: Response; html?: string }> {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow', // Follow redirects like a browser
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

  const contentType = response.headers.get('content-type') || '';
  let html: string | undefined;
  
  // Read HTML if content type is HTML (even on 404 for soft-404 detection)
  if (contentType.includes('text/html')) {
    html = await response.text();
  }
  
  return { response, html };
}

// Helper: Try URL with variants (www/non-www, trailing slash)
async function fetchWithVariants(originalUrl: string): Promise<{
  response: Response;
  html?: string;
  finalUrl: string;
  variantUsed?: string;
}> {
  console.log(`🔍 Fetching with variants: ${originalUrl}`);
  
  const attempts: { url: string; reason: string }[] = [];
  
  // Parse original URL
  const urlObj = new URL(originalUrl);
  
  // Attempt 1: Original URL
  attempts.push({ url: originalUrl, reason: 'original' });
  
  // Attempt 2: Toggle www
  const withoutWww = new URL(originalUrl);
  if (withoutWww.hostname.startsWith('www.')) {
    withoutWww.hostname = withoutWww.hostname.substring(4);
    attempts.push({ url: withoutWww.toString(), reason: 'without-www' });
  } else {
    withoutWww.hostname = 'www.' + withoutWww.hostname;
    attempts.push({ url: withoutWww.toString(), reason: 'with-www' });
  }
  
  // Attempt 3: With trailing slash (if not present and not root)
  if (urlObj.pathname !== '/' && !urlObj.pathname.endsWith('/')) {
    const withSlash = new URL(originalUrl);
    withSlash.pathname = withSlash.pathname + '/';
    attempts.push({ url: withSlash.toString(), reason: 'with-trailing-slash' });
  }
  
  // Attempt 4: Without trailing slash (if present)
  if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
    const withoutSlash = new URL(originalUrl);
    withoutSlash.pathname = withoutSlash.pathname.slice(0, -1);
    attempts.push({ url: withoutSlash.toString(), reason: 'without-trailing-slash' });
  }
  
  // Try each variant
  for (const attempt of attempts) {
    try {
      console.log(`  Trying ${attempt.reason}: ${attempt.url}`);
      const { response, html } = await tryFetchOnce(attempt.url);
      
      console.log(`  → Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
      console.log(`  → Final URL: ${response.url}`);
      
      // Return first 2xx response
      if (response.status >= 200 && response.status < 300) {
        console.log(`  ✅ Success with ${attempt.reason}`);
        return {
          response,
          html,
          finalUrl: response.url,
          variantUsed: attempt.reason !== 'original' ? attempt.reason : undefined
        };
      }
      
      // If it's a 404 with HTML, keep trying but remember this one
      if (response.status === 404 && html) {
        // Continue trying other variants
        continue;
      }
    } catch (error) {
      console.log(`  ❌ Failed ${attempt.reason}:`, error.message);
      // Continue to next variant
    }
  }
  
  // All variants failed, try original one last time and return that
  console.log(`  ⚠️  All variants failed, using original`);
  const { response, html } = await tryFetchOnce(originalUrl);
  return {
    response,
    html,
    finalUrl: response.url,
    variantUsed: undefined
  };
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
    // New SPA-aware defaults
    variantUsed: undefined,
    spaDetected: false,
    canonicalInferred: false,
    inferredReason: undefined,
  };

  try {
    console.log(`\n🔎 Checking URL: ${url}`);
    
    // Try with variants
    const { response, html, finalUrl, variantUsed } = await fetchWithVariants(url);
    
result.status = response.status;
result.finalURL = finalUrl;
result.contentType = response.headers.get('content-type') || undefined;
result.contentLength = parseInt(response.headers.get('content-length') || '0');
result.xRobotsTag = response.headers.get('x-robots-tag') || undefined;
result.variantUsed = variantUsed;
    
    // Mark as redirected if we used a variant or if final URL differs
    if (variantUsed || finalUrl !== url) {
      result.redirected = true;
      result.redirectLocation = variantUsed ? `Resolved via ${variantUsed}: ${finalUrl}` : finalUrl;
    }
    
    console.log(`✅ Final status: ${result.status}, Final URL: ${finalUrl}`);
    if (variantUsed) {
      console.log(`🔄 Variant used: ${variantUsed}`);
    }

    // Parse HTML for both 200 and 404 (for soft-404 detection)
    if (html && result.contentType?.includes('text/html')) {
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
      
      if (result.status === 404 || result.wordCount < 120 || title.includes('404') || title.includes('not found') || h1.includes('404') || h1.includes('niet gevonden')) {
        result.soft404 = true;
      }
      
// Compare canonical (use final URL for comparison)
result.canonicalStatus = compareCanonical(finalUrl, result.canonical, canonicals);

// SPA-aware inference: detect if serving index.html with wrong canonical
const vercelError = response.headers.get('x-vercel-error') || '';
const isHtml = result.contentType?.includes('text/html');

// Check if this is a deep link (not homepage)
const finalUrlObj = new URL(finalUrl);
const isDeepLink = finalUrlObj.pathname !== '/' && finalUrlObj.pathname !== '';

// Check if canonical is homepage canonical
const isHomepageCanonical = result.canonicalStatus === 'HOMEPAGE_CANONICAL';

// Scenario 1: Deep link with homepage canonical = SPA serving index.html
if (isDeepLink && isHomepageCanonical && isHtml) {
  console.log(`🔍 SPA detected: deep link "${finalUrl}" has homepage canonical`);
  result.spaDetected = true;
  result.canonicalInferred = true;
  result.inferredReason = 'Deep link with homepage canonical (SPA index.html)';
  
  // Infer canonical from final URL
  const inferred = normalizeURL(finalUrl);
  result.canonical = inferred;
  result.canonicalStatus = 'OK_SELF';
}
// Scenario 2: No canonical found and looks like SPA shell/404
else {
  const isSpaShell = (!result.canonical) && !!isHtml && (
    result.status === 404 ||
    result.wordCount < 120 ||
    vercelError.toUpperCase().includes('NOT_FOUND')
  );

  if (isSpaShell) {
    console.log(`🔍 SPA detected: no canonical, status ${result.status}, wordcount ${result.wordCount}`);
    result.spaDetected = true;
    result.canonicalInferred = true;
    result.inferredReason = vercelError
      ? `Vercel: ${vercelError}; low-content HTML`
      : 'Low-content HTML / SPA shell without SSR';
    
    // Infer canonical from final URL
    const inferred = normalizeURL(finalUrl);
    result.canonical = inferred;
    result.canonicalStatus = compareCanonical(finalUrl, inferred, [inferred]);
  }
}

console.log(`📊 Canonical: ${result.canonical || 'NONE'}, Status: ${result.canonicalStatus}, Words: ${result.wordCount}`);
    }

  } catch (error) {
    console.error(`❌ Error checking ${url}:`, error);
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
