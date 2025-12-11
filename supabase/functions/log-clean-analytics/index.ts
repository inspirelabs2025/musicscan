import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extended datacenter cities with providers (lowercase for matching)
const DATACENTER_CITIES: Record<string, string> = {
  // Meta/Facebook datacenters
  'prineville': 'Meta Prineville',
  'forest city': 'Meta Forest City',
  'lulea': 'Meta Luleå',
  'luleå': 'Meta Luleå',
  'altoona': 'Meta Altoona',
  'fort worth': 'Meta Fort Worth',
  'new albany': 'Meta New Albany',
  'los lunas': 'Meta Los Lunas',
  'papillion': 'Meta Papillion',
  'henrico': 'Meta Henrico',
  'eagle mountain': 'Meta Eagle Mountain',
  'dekalb': 'Meta DeKalb',
  'kuna': 'Meta Kuna',
  'sarpy': 'Meta Sarpy',
  'richmond': 'Meta Richmond',
  'huntsville': 'Meta Huntsville',
  'gallatin': 'Meta Gallatin',
  'mesa': 'Meta Mesa',
  'jeffersonville': 'Meta Jeffersonville',
  
  // AWS datacenters
  'boardman': 'AWS Boardman',
  'ashburn': 'AWS Ashburn',
  'springfield': 'AWS Springfield',
  'hilliard': 'AWS Hilliard',
  'dublin': 'AWS/Google Dublin',
  'bahrain': 'AWS Bahrain',
  'cape town': 'AWS Cape Town',
  'jakarta': 'AWS Jakarta',
  'osaka': 'AWS Osaka',
  'hyderabad': 'AWS Hyderabad',
  'melbourne': 'AWS Melbourne',
  'zurich': 'AWS Zurich',
  'spain': 'AWS Spain',
  'uae': 'AWS UAE',
  'milan': 'AWS Milan',
  'stockholm': 'AWS Stockholm',
  
  // Google datacenters
  'council bluffs': 'Google Council Bluffs',
  'the dalles': 'Google The Dalles',
  'clarksville': 'Google Clarksville',
  'pryor creek': 'Google Pryor Creek',
  'pryor': 'Google Pryor Creek',
  'lenoir': 'Google Lenoir',
  'montgomery county': 'Google Montgomery',
  'jackson county': 'Google Jackson',
  'berkeley county': 'Google Berkeley',
  'mayes county': 'Google Mayes',
  'storey county': 'Google Storey',
  'henderson': 'Google Henderson',
  'moncks corner': 'Google Moncks Corner',
  'midlothian': 'Google Midlothian',
  'hamina': 'Google Hamina',
  'st. ghislain': 'Google St. Ghislain',
  'eemshaven': 'Google Eemshaven',
  'changhua county': 'Google Changhua',
  
  // Microsoft Azure datacenters
  'quincy': 'Azure Quincy',
  'san antonio': 'Azure San Antonio',
  'boydton': 'Azure Boydton',
  'cheyenne': 'Azure Cheyenne',
  'des moines': 'Azure Des Moines',
  'pune': 'Azure Pune',
  'chennai': 'Azure Chennai',
  
  // General cloud regions (more suspicious)
  'hong kong': 'Cloud Hong Kong',
  'singapore': 'Cloud Singapore',
  'tokyo': 'Cloud Tokyo',
  'sydney': 'Cloud Sydney',
  'frankfurt': 'Cloud Frankfurt',
  'london': 'Cloud London',
  'paris': 'Cloud Paris',
  'mumbai': 'Cloud Mumbai',
  'são paulo': 'Cloud São Paulo',
  'sao paulo': 'Cloud São Paulo',
  'seoul': 'Cloud Seoul',
  'amsterdam': 'Cloud Amsterdam',
  'oregon': 'Cloud Oregon',
  'northern virginia': 'Cloud N. Virginia',
  'n. virginia': 'Cloud N. Virginia',
};

// Known datacenter IP prefixes (first 2-3 octets)
const DATACENTER_IP_PREFIXES = [
  // AWS ranges (partial)
  '3.', '13.', '15.', '18.', '34.', '35.', '43.', '44.', '46.', '47.', '50.', '52.', '54.', '63.', '64.', '65.', '67.', '68.', '69.', '70.', '71.', '72.', '75.', '76.', '79.', '99.', '100.', '107.', '108.', '157.', '174.', '175.', '176.', '184.', '185.', '199.', '203.', '204.', '205.', '216.',
  // Google Cloud
  '8.34.', '8.35.', '23.236.', '23.251.', '34.', '35.', '104.196.', '104.197.', '104.198.', '104.199.', '107.167.', '107.178.', '108.59.', '108.170.', '130.211.', '142.250.', '146.148.', '162.216.', '162.222.', '173.194.', '173.255.', '192.158.', '199.36.', '199.192.', '199.223.', '207.223.', '209.85.', '216.58.', '216.239.',
  // Microsoft Azure
  '13.64.', '13.65.', '13.66.', '13.67.', '13.68.', '13.69.', '13.70.', '13.71.', '13.72.', '13.73.', '13.74.', '13.75.', '13.76.', '13.77.', '13.78.', '13.79.', '13.80.', '13.81.', '13.82.', '13.83.', '13.84.', '13.85.', '13.86.', '13.87.', '13.88.', '13.89.', '13.90.', '13.91.', '13.92.', '13.93.', '13.94.', '13.95.', '20.', '40.', '51.', '52.', '65.', '68.', '70.', '74.', '104.40.', '104.41.', '104.42.', '104.43.', '104.44.', '104.45.', '104.46.', '104.47.', '104.208.', '104.209.', '104.210.', '104.211.', '104.214.', '104.215.',
  // DigitalOcean
  '104.131.', '104.236.', '107.170.', '128.199.', '134.209.', '137.184.', '138.68.', '138.197.', '139.59.', '142.93.', '143.110.', '143.198.', '144.126.', '157.230.', '157.245.', '159.65.', '159.89.', '161.35.', '162.243.', '163.47.', '164.90.', '164.92.', '165.22.', '165.227.', '167.71.', '167.99.', '167.172.', '170.64.', '174.138.', '178.62.', '178.128.', '188.166.', '192.241.', '198.199.', '198.211.', '206.81.', '206.189.', '209.97.',
  // Cloudflare
  '104.16.', '104.17.', '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.', '104.24.', '104.25.', '104.26.', '104.27.', '172.64.', '172.65.', '172.66.', '172.67.', '173.245.',
  // Hetzner
  '5.75.', '49.12.', '65.21.', '78.46.', '78.47.', '88.198.', '88.99.', '91.107.', '116.202.', '116.203.', '128.140.', '135.181.', '136.243.', '138.201.', '142.132.', '144.76.', '148.251.', '157.90.', '159.69.', '162.55.', '167.233.', '168.119.', '176.9.', '178.63.', '185.189.', '188.34.', '188.40.', '195.201.', '213.133.', '213.239.',
  // OVH
  '51.38.', '51.68.', '51.75.', '51.77.', '51.79.', '51.81.', '51.83.', '51.89.', '51.91.', '51.161.', '51.178.', '51.195.', '51.210.', '51.254.', '51.255.', '54.36.', '54.37.', '54.38.', '54.39.', '57.128.', '57.129.', '135.125.', '137.74.', '139.99.', '141.94.', '141.95.', '142.44.', '144.2.', '145.239.', '146.59.', '147.135.', '148.113.', '149.56.', '149.202.', '151.80.', '158.69.', '162.19.', '164.132.', '167.114.', '176.31.', '178.32.', '178.33.', '185.12.', '188.165.', '192.95.', '192.99.', '193.70.', '195.154.', '198.27.', '198.50.', '198.100.', '198.245.', '213.186.', '213.251.', '217.182.',
  // Linode/Akamai
  '45.33.', '45.56.', '45.79.', '50.116.', '66.175.', '69.164.', '72.14.', '74.207.', '96.126.', '97.107.', '139.144.', '139.162.', '143.42.', '170.187.', '172.104.', '172.105.', '173.230.', '173.255.', '176.58.', '178.79.', '192.155.', '194.195.', '198.58.', '198.74.', '212.71.', '213.168.',
  // Vultr
  '45.32.', '45.63.', '45.76.', '45.77.', '64.156.', '64.237.', '66.42.', '67.219.', '78.141.', '80.240.', '95.179.', '104.156.', '104.207.', '104.238.', '108.61.', '136.244.', '139.180.', '140.82.', '141.164.', '144.202.', '149.28.', '155.138.', '167.179.', '192.248.', '199.247.', '207.148.', '208.167.', '209.250.', '216.128.', '217.69.',
];

// Bot/crawler user agents (lowercase)
const BOT_USER_AGENTS = [
  // Social media crawlers
  'facebookexternalhit', 'facebot', 'whatsapp', 'instagram', 'twitterbot', 'linkedinbot', 'pinterest', 'slackbot', 'telegrambot', 'discordbot',
  // Search engine bots
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot', 'sogou', 'exabot', 'ia_archiver', 'mj12bot', 'seznambot', 'applebot', 'amazonbot',
  // SEO/Marketing bots
  'semrushbot', 'ahrefsbot', 'dotbot', 'petalbot', 'rogerbot', 'screaming frog', 'majestic', 'moz.com',
  // AI crawlers
  'gptbot', 'chatgpt', 'claude', 'anthropic', 'perplexity', 'bytespider', 'ccbot', 'cohere-ai',
  // Generic patterns
  'crawler', 'spider', 'bot/', 'bot;', 'scraper', 'fetch', 'wget', 'curl', 'python', 'java/', 'perl', 'ruby', 'go-http-client', 'axios', 'node-fetch', 'httpx',
  // Headless browsers
  'headless', 'phantomjs', 'selenium', 'puppeteer', 'playwright', 'webdriver', 'chromedriver',
  // CDN/Proxy
  'cloudflare', 'cloudfront', 'fastly', 'akamai', 'incapsula', 'sucuri', 'imperva',
  // Monitoring
  'pingdom', 'uptimerobot', 'newrelic', 'datadog', 'statuscake', 'site24x7', 'hetrix', 'nodeping',
];

// Suspicious referrer patterns
const SUSPICIOUS_REFERRERS = [
  'semalt', 'buttons-for-website', 'make-money', 'free-share-buttons', 'event-tracking', 
  'get-free-traffic', 'traffic2money', 'best-seo-offer', 'buy-cheap-online',
];

interface ClassifyResult {
  is_datacenter: boolean;
  datacenter_name: string | null;
  real_country: string | null;
  real_user_score: number;
  device_type: string;
  browser: string | null;
}

function isDatacenterIP(ip: string): { isDatacenter: boolean; provider: string | null } {
  if (!ip) return { isDatacenter: false, provider: null };
  
  for (const prefix of DATACENTER_IP_PREFIXES) {
    if (ip.startsWith(prefix)) {
      // Determine provider from prefix
      if (prefix.startsWith('3.') || prefix.startsWith('13.') || prefix.startsWith('15.') || prefix.startsWith('18.') || prefix.startsWith('52.') || prefix.startsWith('54.')) {
        return { isDatacenter: true, provider: 'AWS' };
      }
      if (prefix.startsWith('34.') || prefix.startsWith('35.') || prefix.startsWith('104.19') || prefix.startsWith('142.250')) {
        return { isDatacenter: true, provider: 'Google Cloud' };
      }
      if (prefix.startsWith('20.') || prefix.startsWith('40.') || prefix.startsWith('51.') || prefix.startsWith('104.4')) {
        return { isDatacenter: true, provider: 'Azure' };
      }
      if (prefix.startsWith('104.16') || prefix.startsWith('172.6')) {
        return { isDatacenter: true, provider: 'Cloudflare' };
      }
      if (prefix.startsWith('178.128') || prefix.startsWith('134.209') || prefix.startsWith('167.')) {
        return { isDatacenter: true, provider: 'DigitalOcean' };
      }
      if (prefix.startsWith('5.75') || prefix.startsWith('65.21') || prefix.startsWith('135.181') || prefix.startsWith('168.119')) {
        return { isDatacenter: true, provider: 'Hetzner' };
      }
      return { isDatacenter: true, provider: 'Cloud Provider' };
    }
  }
  
  return { isDatacenter: false, provider: null };
}

function classifyTraffic(params: {
  ip?: string;
  city?: string;
  country?: string;
  region?: string;
  userAgent?: string;
  referrer?: string;
}): ClassifyResult {
  const { ip, city, country, region, userAgent, referrer } = params;
  const cityLower = (city || '').toLowerCase().trim();
  const regionLower = (region || '').toLowerCase().trim();
  const uaLower = (userAgent || '').toLowerCase();
  const refLower = (referrer || '').toLowerCase();
  
  let is_datacenter = false;
  let datacenter_name: string | null = null;
  let real_user_score = 100;
  let device_type = 'unknown';
  let browser: string | null = null;
  
  // 1. Check datacenter cities (highest confidence)
  for (const [dcCity, dcName] of Object.entries(DATACENTER_CITIES)) {
    if (cityLower === dcCity || cityLower.includes(dcCity)) {
      is_datacenter = true;
      datacenter_name = dcName;
      real_user_score = 5;
      break;
    }
  }
  
  // 2. Check IP ranges for known datacenters
  if (!is_datacenter && ip) {
    const ipCheck = isDatacenterIP(ip);
    if (ipCheck.isDatacenter) {
      is_datacenter = true;
      datacenter_name = datacenter_name || ipCheck.provider;
      real_user_score = Math.min(real_user_score, 15);
    }
  }
  
  // 3. Check bot user agents (definitive)
  for (const botUA of BOT_USER_AGENTS) {
    if (uaLower.includes(botUA)) {
      is_datacenter = true;
      datacenter_name = datacenter_name || `Bot: ${botUA}`;
      real_user_score = 0;
      device_type = 'bot';
      break;
    }
  }
  
  // 4. Check suspicious referrers
  if (referrer) {
    for (const suspicious of SUSPICIOUS_REFERRERS) {
      if (refLower.includes(suspicious)) {
        is_datacenter = true;
        datacenter_name = datacenter_name || 'Spam Referrer';
        real_user_score = Math.min(real_user_score, 5);
        break;
      }
    }
  }
  
  // 5. Detect device type from user agent
  if (device_type === 'unknown') {
    if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone') || uaLower.includes('ipod')) {
      device_type = 'mobile';
    } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
      device_type = 'tablet';
    } else if (uaLower.includes('windows') || uaLower.includes('macintosh') || uaLower.includes('mac os') || uaLower.includes('linux x86_64') || uaLower.includes('cros')) {
      device_type = 'desktop';
    } else if (uaLower.includes('smart-tv') || uaLower.includes('smarttv') || uaLower.includes('webos') || uaLower.includes('tizen')) {
      device_type = 'tv';
    }
  }
  
  // 6. Detect browser
  if (uaLower.includes('edg/') || uaLower.includes('edge/')) {
    browser = 'Edge';
  } else if (uaLower.includes('opr/') || uaLower.includes('opera')) {
    browser = 'Opera';
  } else if (uaLower.includes('chrome/') && !uaLower.includes('chromium')) {
    browser = 'Chrome';
  } else if (uaLower.includes('firefox/')) {
    browser = 'Firefox';
  } else if (uaLower.includes('safari/') && !uaLower.includes('chrome') && !uaLower.includes('chromium')) {
    browser = 'Safari';
  } else if (uaLower.includes('msie') || uaLower.includes('trident/')) {
    browser = 'IE';
  } else if (uaLower.includes('chromium')) {
    browser = 'Chromium';
  }
  
  // 7. Scoring adjustments based on signals
  
  // No browser detected is suspicious (unless already marked as bot)
  if (!browser && device_type !== 'bot') {
    real_user_score = Math.min(real_user_score, 25);
    if (!is_datacenter && userAgent && userAgent.length < 50) {
      is_datacenter = true;
      datacenter_name = datacenter_name || 'Unknown Client';
    }
  }
  
  // Very short or missing user agent is suspicious
  if (!userAgent || userAgent.length < 30) {
    real_user_score = Math.min(real_user_score, 10);
    if (!is_datacenter) {
      is_datacenter = true;
      datacenter_name = datacenter_name || 'Missing UA';
    }
  }
  
  // Real referrer from legitimate sources boosts score
  if (referrer && !is_datacenter) {
    if (refLower.includes('google.') || refLower.includes('bing.') || refLower.includes('duckduckgo.') || refLower.includes('ecosia.') || refLower.includes('yahoo.')) {
      real_user_score = Math.min(real_user_score + 15, 100);
    } else if (refLower.includes('facebook.com') || refLower.includes('twitter.com') || refLower.includes('linkedin.com') || refLower.includes('instagram.com') || refLower.includes('tiktok.com')) {
      real_user_score = Math.min(real_user_score + 10, 100);
    } else if (refLower.includes('musicscan.')) {
      // Internal navigation - good signal
      real_user_score = Math.min(real_user_score + 5, 100);
    }
  }
  
  // Direct traffic from datacenter is very suspicious
  if (!referrer && is_datacenter) {
    real_user_score = Math.min(real_user_score, 5);
  }
  
  // Desktop with real browser is a good signal
  if (device_type === 'desktop' && browser && !is_datacenter) {
    real_user_score = Math.min(real_user_score + 5, 100);
  }
  
  // Mobile with real browser is a very good signal
  if (device_type === 'mobile' && browser && !is_datacenter) {
    real_user_score = Math.min(real_user_score + 10, 100);
  }
  
  // Country-specific logic - determine real_country only for non-datacenter traffic
  const real_country = is_datacenter ? null : country;
  
  return {
    is_datacenter,
    datacenter_name,
    real_country,
    real_user_score: Math.max(0, Math.min(100, real_user_score)),
    device_type,
    browser,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { 
      ip, 
      city, 
      country, 
      region,
      userAgent, 
      referrer, 
      path, 
      sessionId,
      // New fields
      visitorId,
      isNewVisitor,
      sessionStartAt,
      scrollDepth,
      timeOnPage,
      previousPath,
      isBounce,
      pageLoadTime,
      // UTM params
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = body;

    console.log(`[log-clean-analytics] Processing: city=${city}, country=${country}, path=${path}, visitor=${visitorId?.substring(0, 10)}...`);

    // Classify the traffic
    const classification = classifyTraffic({
      ip,
      city,
      country,
      region,
      userAgent,
      referrer,
    });

    console.log(`[log-clean-analytics] Result: is_datacenter=${classification.is_datacenter}, score=${classification.real_user_score}, device=${classification.device_type}`);

    // Insert into clean_analytics
    const { data, error } = await supabase
      .from('clean_analytics')
      .insert({
        ip,
        user_agent: userAgent,
        city,
        country,
        region,
        is_datacenter: classification.is_datacenter,
        datacenter_name: classification.datacenter_name,
        real_country: classification.real_country,
        real_user_score: classification.real_user_score,
        device_type: classification.device_type,
        browser: classification.browser,
        referrer,
        path,
        session_id: sessionId,
        // New fields
        visitor_id: visitorId,
        is_new_visitor: isNewVisitor || false,
        session_start_at: sessionStartAt,
        scroll_depth: scrollDepth,
        time_on_page: timeOnPage,
        previous_path: previousPath,
        is_bounce: isBounce,
        page_load_time: pageLoadTime,
        // UTM params
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
      })
      .select()
      .single();

    if (error) {
      console.error(`[log-clean-analytics] Insert error:`, error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        is_datacenter: classification.is_datacenter,
        real_user_score: classification.real_user_score,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[log-clean-analytics] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
