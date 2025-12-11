import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Datacenter cities and their providers
const DATACENTER_CITIES: Record<string, string> = {
  'boardman': 'AWS Boardman',
  'dublin': 'Google/Facebook Dublin',
  'forest city': 'Meta Forest City',
  'prineville': 'Meta Prineville',
  'lulea': 'Meta Luleå',
  'luleå': 'Meta Luleå',
  'altoona': 'Meta Altoona',
  'gallatin': 'AWS/Meta Gallatin',
  'springfield': 'AWS Springfield',
  'fort worth': 'Meta Fort Worth',
  'ashburn': 'AWS Ashburn',
  'des moines': 'Meta Des Moines',
  'council bluffs': 'Google Council Bluffs',
  'the dalles': 'Google The Dalles',
  'papillion': 'Meta Papillion',
  'new albany': 'Meta New Albany',
  'richmond': 'Meta Richmond',
  'huntsville': 'Meta Huntsville',
  'henrico': 'Meta Henrico',
  'dekalb': 'Meta DeKalb',
  'eagle mountain': 'Meta Eagle Mountain',
  'kuna': 'Meta Kuna',
  'sarpy': 'Meta Sarpy',
  'clarksville': 'Google Clarksville',
  'pryor creek': 'Google Pryor Creek',
  'lenoir': 'Google Lenoir',
  'montgomery county': 'Google Montgomery',
  'jackson county': 'Google Jackson',
  'berkeley county': 'Google Berkeley',
  'mayes county': 'Google Mayes',
  'storey county': 'Google Storey',
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
};

// Bot/crawler user agents
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'whatsapp',
  'instagram',
  'twitterbot',
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot',
  'ia_archiver',
  'mj12bot',
  'semrushbot',
  'ahrefsbot',
  'dotbot',
  'petalbot',
  'seznambot',
  'cloudflare',
  'amazonbot',
  'applebot',
  'gptbot',
  'chatgpt',
  'claude',
  'anthropic',
  'perplexity',
  'bytespider',
  'crawler',
  'spider',
  'bot/',
  'headless',
  'phantomjs',
  'selenium',
  'puppeteer',
  'playwright',
];

interface ClassifyResult {
  is_datacenter: boolean;
  datacenter_name: string | null;
  real_country: string | null;
  real_user_score: number;
  device_type: string;
  browser: string | null;
}

function classifyTraffic(params: {
  ip?: string;
  city?: string;
  country?: string;
  userAgent?: string;
  referrer?: string;
}): ClassifyResult {
  const { city, country, userAgent, referrer } = params;
  const cityLower = (city || '').toLowerCase().trim();
  const uaLower = (userAgent || '').toLowerCase();
  
  let is_datacenter = false;
  let datacenter_name: string | null = null;
  let real_user_score = 100;
  let device_type = 'unknown';
  let browser: string | null = null;
  
  // Check datacenter cities
  for (const [dcCity, dcName] of Object.entries(DATACENTER_CITIES)) {
    if (cityLower.includes(dcCity)) {
      is_datacenter = true;
      datacenter_name = dcName;
      real_user_score = 5;
      break;
    }
  }
  
  // Check bot user agents
  for (const botUA of BOT_USER_AGENTS) {
    if (uaLower.includes(botUA)) {
      is_datacenter = true;
      datacenter_name = datacenter_name || `Bot: ${botUA}`;
      real_user_score = Math.min(real_user_score, 0);
      device_type = 'bot';
      break;
    }
  }
  
  // Detect device type from user agent
  if (device_type === 'unknown') {
    if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) {
      device_type = 'mobile';
      real_user_score = Math.min(real_user_score, 95);
    } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
      device_type = 'tablet';
      real_user_score = Math.min(real_user_score, 95);
    } else if (uaLower.includes('windows') || uaLower.includes('macintosh') || uaLower.includes('linux')) {
      device_type = 'desktop';
      real_user_score = Math.min(real_user_score, 90);
    }
  }
  
  // Detect browser
  if (uaLower.includes('chrome') && !uaLower.includes('edge') && !uaLower.includes('opr')) {
    browser = 'Chrome';
  } else if (uaLower.includes('firefox')) {
    browser = 'Firefox';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
    browser = 'Safari';
  } else if (uaLower.includes('edge')) {
    browser = 'Edge';
  } else if (uaLower.includes('opr') || uaLower.includes('opera')) {
    browser = 'Opera';
  }
  
  // No browser detected is suspicious
  if (!browser && device_type !== 'bot') {
    real_user_score = Math.min(real_user_score, 30);
    if (!is_datacenter) {
      datacenter_name = 'Unknown Client';
    }
  }
  
  // Referrer analysis - direct traffic from datacenter is suspicious
  if (!referrer && is_datacenter) {
    real_user_score = Math.min(real_user_score, 10);
  }
  
  // Real referrer from social/search boosts score
  if (referrer) {
    const refLower = referrer.toLowerCase();
    if (refLower.includes('google.') || refLower.includes('bing.') || refLower.includes('duckduckgo')) {
      real_user_score = Math.min(real_user_score + 20, 100);
    } else if (refLower.includes('facebook.com') || refLower.includes('twitter.com') || refLower.includes('linkedin.com')) {
      real_user_score = Math.min(real_user_score + 15, 100);
    }
  }
  
  // Country-specific logic - some regions have high datacenter density
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
      sessionId 
    } = body;

    console.log(`[log-clean-analytics] Processing request from ${city}, ${country}`);

    // Classify the traffic
    const classification = classifyTraffic({
      ip,
      city,
      country,
      userAgent,
      referrer,
    });

    console.log(`[log-clean-analytics] Classification: is_datacenter=${classification.is_datacenter}, score=${classification.real_user_score}`);

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
      })
      .select()
      .single();

    if (error) {
      console.error(`[log-clean-analytics] Insert error:`, error);
      throw error;
    }

    console.log(`[log-clean-analytics] Logged analytics entry: ${data.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        is_datacenter: classification.is_datacenter,
        datacenter_name: classification.datacenter_name,
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
